package database

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func CleanupOrphanedData() (int, error) {
	ctx := context.Background()

	// Get all valid user IDs
	cursor, err := UsersCollection().Find(ctx, bson.M{})
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	validUserIDs := make(map[string]bool)
	for cursor.Next(ctx) {
		var user UserMongo
		if err := cursor.Decode(&user); err == nil {
			validUserIDs[user.ID.Hex()] = true
		}
	}

	deletedCount := 0

	// Helper to cleanup a collection
	cleanupCollection := func(coll *mongo.Collection, dateField string) {
		cur, err := coll.Find(ctx, bson.M{})
		if err != nil {
			return
		}
		defer cur.Close(ctx)

		for cur.Next(ctx) {
			var doc bson.M
			if err := cur.Decode(&doc); err != nil {
				continue
			}

			// Check if user_id exists and is valid
			userID, ok := doc["user_id"].(string)
			if !ok || !validUserIDs[userID] {
				// Delete
				_, _ = coll.DeleteOne(ctx, bson.M{"_id": doc["_id"]})
				deletedCount++
			}
		}
	}

	// Collections to cleanup
	cleanupCollection(AttendanceCollection(), "date")
	cleanupCollection(WorkPermitsCollection(), "date")
	cleanupCollection(PendingRequestsCollection(), "date")
	cleanupCollection(AwardsCollection(), "date")
	cleanupCollection(LeaveQuotasCollection(), "created_at")

	return deletedCount, nil
}
