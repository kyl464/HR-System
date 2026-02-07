package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	client   *mongo.Client
	database *mongo.Database
)

// MongoDB models with BSON tags
// UserMongo now contains both authentication and employee profile fields
type UserMongo struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email    string             `bson:"email" json:"email"`
	Password string             `bson:"password,omitempty" json:"password,omitempty"`
	Name     string             `bson:"name" json:"name"`
	Role     string             `bson:"role" json:"role"`
	IsAdmin  bool               `bson:"is_admin" json:"is_admin"`
	// Employee profile fields
	Center          string      `bson:"center" json:"center"`
	Roles           string      `bson:"roles" json:"roles"` // Job roles like "Assistant Coach"
	PhotoURL        string      `bson:"photo_url" json:"photo_url"`
	BranchID        interface{} `bson:"branch_id" json:"branch_id"`
	Sex             string      `bson:"sex" json:"sex"`
	PoB             string      `bson:"pob" json:"pob"`
	DoB             string      `bson:"dob" json:"dob"`
	Age             int         `bson:"age" json:"age"`
	Religion        string      `bson:"religion" json:"religion"`
	Phone           string      `bson:"phone" json:"phone"`
	Address1        string      `bson:"address1" json:"address1"`
	Address2        string      `bson:"address2" json:"address2"`
	NIK             string      `bson:"nik" json:"nik"`
	NPWP            string      `bson:"npwp" json:"npwp"`
	EducationLevel  string      `bson:"education_level" json:"education_level"`
	Institution     string      `bson:"institution" json:"institution"`
	Major           string      `bson:"major" json:"major"`
	GraduationYear  int         `bson:"graduation_year" json:"graduation_year"`
	BankAccount     string      `bson:"bank_account" json:"bank_account"`
	StatusPTKP      string      `bson:"status_ptkp" json:"status_ptkp"`
	Jabatan         string      `bson:"jabatan" json:"jabatan"`
	ShowInDirectory bool        `bson:"show_in_directory" json:"show_in_directory"`
}

// EmployeeMongo kept for backwards compatibility, maps to UserMongo
type EmployeeMongo struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         string             `bson:"user_id" json:"user_id"`
	Name           string             `bson:"name" json:"name"`
	Center         string             `bson:"center" json:"center"`
	Roles          string             `bson:"roles" json:"roles"`
	PhotoURL       string             `bson:"photo_url" json:"photo_url"`
	BranchID       interface{}        `bson:"branch_id" json:"branch_id"`
	Sex            string             `bson:"sex" json:"sex"`
	PoB            string             `bson:"pob" json:"pob"`
	DoB            string             `bson:"dob" json:"dob"`
	Age            int                `bson:"age" json:"age"`
	Religion       string             `bson:"religion" json:"religion"`
	Phone          string             `bson:"phone" json:"phone"`
	Address1       string             `bson:"address1" json:"address1"`
	Address2       string             `bson:"address2" json:"address2"`
	NIK            string             `bson:"nik" json:"nik"`
	NPWP           string             `bson:"npwp" json:"npwp"`
	EducationLevel string             `bson:"education_level" json:"education_level"`
	Institution    string             `bson:"institution" json:"institution"`
	Major          string             `bson:"major" json:"major"`
	GraduationYear int                `bson:"graduation_year" json:"graduation_year"`
	BankAccount    string             `bson:"bank_account" json:"bank_account"`
	StatusPTKP     string             `bson:"status_ptkp" json:"status_ptkp"`
	Jabatan        string             `bson:"jabatan" json:"jabatan"`
	Email          string             `bson:"email" json:"email"`
}

type AttendanceMongo struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID             string             `bson:"user_id" json:"user_id"`
	Date               string             `bson:"date" json:"date"`
	ActivityType       string             `bson:"activity_type" json:"activity_type"`
	ActivityCategories []string           `bson:"activity_categories" json:"activity_categories"`
	ActivityDetails    string             `bson:"activity_details" json:"activity_details"`
	StartingTime       string             `bson:"starting_time" json:"starting_time"`
	EndingTime         string             `bson:"ending_time" json:"ending_time"`
	ActivityDocs       string             `bson:"activity_docs" json:"activity_docs"`
	ActivityNotes      string             `bson:"activity_notes" json:"activity_notes"`
	Session            string             `bson:"session" json:"session"`
	Status             string             `bson:"status" json:"status"`
	CreatedAt          string             `bson:"created_at" json:"created_at"`
}

type AnnouncementMongo struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string             `bson:"title" json:"title"`
	Content   string             `bson:"content" json:"content"`
	IsActive  bool               `bson:"is_active" json:"is_active"`
	CreatedAt string             `bson:"created_at" json:"created_at"`
}

type CalendarEventMongo struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Date      string             `bson:"date" json:"date"`
	Type      string             `bson:"type" json:"type"` // holiday, meeting, event
	Title     string             `bson:"title" json:"title"`
	CreatedAt string             `bson:"created_at" json:"created_at"`
}

type WorkPermitMongo struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         string             `bson:"user_id" json:"user_id"`
	Date           string             `bson:"date" json:"date"`
	Session        string             `bson:"session" json:"session"`
	LeaveType      string             `bson:"leave_type" json:"leave_type"`
	Reason         string             `bson:"reason" json:"reason"`
	SupportingFile string             `bson:"supporting_file" json:"supporting_file"`
	Status         string             `bson:"status" json:"status"`
}

type LeaveQuotaMongo struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    string             `bson:"user_id" json:"user_id"`
	Year      int                `bson:"year" json:"year"`
	Total     int                `bson:"total" json:"total"`
	Used      int                `bson:"used" json:"used"`
	Remaining int                `bson:"remaining" json:"remaining"`
}

type PendingRequestMongo struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type           string             `bson:"type" json:"type"`
	UserID         string             `bson:"user_id" json:"user_id"`
	UserName       string             `bson:"user_name" json:"user_name"`
	Date           string             `bson:"date" json:"date"`
	Reason         string             `bson:"reason" json:"reason"`
	Details        string             `bson:"details" json:"details"`
	Status         string             `bson:"status" json:"status"`
	RejectReason   string             `bson:"reject_reason" json:"reject_reason"`
	CreatedAt      string             `bson:"created_at" json:"created_at"`
	RefID          string             `bson:"ref_id" json:"ref_id"`
	SupportingFile string             `bson:"supporting_file" json:"supporting_file"`
}

type BranchMongo struct {
	ID     primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name   string             `bson:"name" json:"name"`
	Region string             `bson:"region" json:"region"`
}

type SchoolMongo struct {
	ID      primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name    string             `bson:"name" json:"name"`
	Level   string             `bson:"level" json:"level"` // e.g., SD, SMP, SMA
	Address string             `bson:"address" json:"address"`
}

type AwardMongo struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID      string             `bson:"user_id" json:"user_id"`
	UserName    string             `bson:"user_name" json:"user_name"`
	Title       string             `bson:"title" json:"title"`
	Description string             `bson:"description" json:"description"`
	Date        string             `bson:"date" json:"date"`
	CreatedAt   string             `bson:"created_at" json:"created_at"`
}

// ConnectMongoDB initializes MongoDB connection
func ConnectMongoDB() error {
	uri := os.Getenv("MONGODB_URI")
	if uri == "" {
		// MongoDB Atlas connection string
		uri = "mongodb+srv://admin:DEMO@hris-demo.lvd8luy.mongodb.net/?appName=HRIS-Demo"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	client, err = mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}

	// Ping to verify connection
	if err = client.Ping(ctx, nil); err != nil {
		return err
	}

	dbName := os.Getenv("MONGODB_DB")
	if dbName == "" {
		dbName = "HRIS-Demo"
	}
	database = client.Database(dbName)

	log.Println("Connected to MongoDB:", dbName)
	return nil
}

// Collection getters
func UsersCollection() *mongo.Collection {
	return database.Collection("users")
}

func EmployeesCollection() *mongo.Collection {
	return database.Collection("employees")
}

func AttendanceCollection() *mongo.Collection {
	return database.Collection("attendance")
}

func AnnouncementsCollection() *mongo.Collection {
	return database.Collection("announcements")
}

func WorkPermitsCollection() *mongo.Collection {
	return database.Collection("work_permits")
}

func LeaveQuotasCollection() *mongo.Collection {
	return database.Collection("leave_quotas")
}

func PendingRequestsCollection() *mongo.Collection {
	return database.Collection("pending_requests")
}

func BranchesCollection() *mongo.Collection {
	return database.Collection("branches")
}

func SchoolsCollection() *mongo.Collection {
	return database.Collection("schools")
}

func CalendarEventsCollection() *mongo.Collection {
	return database.Collection("calendar_events")
}

func AwardsCollection() *mongo.Collection {
	return database.Collection("awards")
}

// --- User CRUD ---
func GetUserByEmail(email string) (*UserMongo, error) {
	ctx := context.Background()
	var user UserMongo
	err := UsersCollection().FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserByIDMongo(id string) (*UserMongo, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var user UserMongo
	err = UsersCollection().FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetAllUsersMongo() ([]UserMongo, error) {
	ctx := context.Background()
	cursor, err := UsersCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []UserMongo
	if err = cursor.All(ctx, &users); err != nil {
		return nil, err
	}
	// Clear passwords
	for i := range users {
		users[i].Password = ""
	}
	return users, nil
}

func CreateUserMongo(user UserMongo) (*UserMongo, error) {
	ctx := context.Background()
	result, err := UsersCollection().InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}
	user.ID = result.InsertedID.(primitive.ObjectID)
	return &user, nil
}

func UpdateUserMongo(id string, user UserMongo) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = UsersCollection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": user})
	return err
}

func DeleteUserMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = UsersCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// --- Attendance CRUD ---
func GetAttendanceByUser(userID string) ([]AttendanceMongo, error) {
	ctx := context.Background()
	cursor, err := AttendanceCollection().Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var records []AttendanceMongo
	if err = cursor.All(ctx, &records); err != nil {
		return nil, err
	}
	return records, nil
}

func GetAllAttendanceRecordsMongo() ([]AttendanceMongo, error) {
	ctx := context.Background()
	cursor, err := AttendanceCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var records []AttendanceMongo
	if err = cursor.All(ctx, &records); err != nil {
		return nil, err
	}
	return records, nil
}

func AddAttendanceMongo(att AttendanceMongo) (*AttendanceMongo, error) {
	ctx := context.Background()
	result, err := AttendanceCollection().InsertOne(ctx, att)
	if err != nil {
		return nil, err
	}
	att.ID = result.InsertedID.(primitive.ObjectID)
	return &att, nil
}

func DeleteAttendanceMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = AttendanceCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

func DeleteAttendanceByUser(userID string) error {
	ctx := context.Background()
	_, err := AttendanceCollection().DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

// --- Employee CRUD ---
// GetAllEmployeesMongo now returns users from users collection since User == Employee
func GetAllEmployeesMongo() ([]EmployeeMongo, error) {
	ctx := context.Background()
	// Filter: Show in directory is true OR doesn't exist (default true)
	// Using bson.A for the array is safer with mongo-driver
	filter := bson.M{"$or": bson.A{
		bson.M{"show_in_directory": true},
		bson.M{"show_in_directory": bson.M{"$exists": false}},
	}}
	fmt.Println("GetAllEmployeesMongo: Fetching with filter:", filter)
	cursor, err := UsersCollection().Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []UserMongo
	if err = cursor.All(ctx, &users); err != nil {
		return nil, err
	}

	// Convert to EmployeeMongo format for backwards compatibility
	var employees []EmployeeMongo
	for _, u := range users {
		emp := EmployeeMongo{
			ID:             u.ID,
			UserID:         u.ID.Hex(),
			Name:           u.Name,
			Center:         u.Center,
			Roles:          u.Roles,
			PhotoURL:       u.PhotoURL,
			BranchID:       u.BranchID,
			Sex:            u.Sex,
			PoB:            u.PoB,
			DoB:            u.DoB,
			Age:            u.Age,
			Religion:       u.Religion,
			Phone:          u.Phone,
			Address1:       u.Address1,
			NIK:            u.NIK,
			NPWP:           u.NPWP,
			EducationLevel: u.EducationLevel,
			Institution:    u.Institution,
			Major:          u.Major,
			GraduationYear: u.GraduationYear,
			BankAccount:    u.BankAccount,
			StatusPTKP:     u.StatusPTKP,
			Jabatan:        u.Jabatan,
			Email:          u.Email,
		}
		employees = append(employees, emp)
	}
	return employees, nil
}

func CreateEmployeeMongo(emp EmployeeMongo) (*EmployeeMongo, error) {
	ctx := context.Background()
	result, err := EmployeesCollection().InsertOne(ctx, emp)
	if err != nil {
		return nil, err
	}
	emp.ID = result.InsertedID.(primitive.ObjectID)
	return &emp, nil
}

func UpdateEmployeeMongo(id string, emp EmployeeMongo) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = EmployeesCollection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": emp})
	return err
}

func DeleteEmployeeMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = EmployeesCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// --- Announcements CRUD ---
func GetAnnouncementsMongo() ([]AnnouncementMongo, error) {
	ctx := context.Background()
	cursor, err := AnnouncementsCollection().Find(ctx, bson.M{"is_active": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var announcements []AnnouncementMongo
	if err = cursor.All(ctx, &announcements); err != nil {
		return nil, err
	}
	return announcements, nil
}

func CreateAnnouncementMongo(ann AnnouncementMongo) (*AnnouncementMongo, error) {
	ctx := context.Background()
	result, err := AnnouncementsCollection().InsertOne(ctx, ann)
	if err != nil {
		return nil, err
	}
	ann.ID = result.InsertedID.(primitive.ObjectID)
	return &ann, nil
}

func DeleteAnnouncementMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = AnnouncementsCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// --- Work Permits CRUD ---
func GetWorkPermitsByUser(userID string) ([]WorkPermitMongo, error) {
	ctx := context.Background()
	cursor, err := WorkPermitsCollection().Find(ctx, bson.M{"user_id": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var permits []WorkPermitMongo
	if err = cursor.All(ctx, &permits); err != nil {
		return nil, err
	}
	return permits, nil
}

// GetAllWorkPermitsMongo retrieves all work permits for admin logs
func GetAllWorkPermitsMongo() ([]WorkPermitMongo, error) {
	ctx := context.Background()
	cursor, err := WorkPermitsCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var permits []WorkPermitMongo
	if err = cursor.All(ctx, &permits); err != nil {
		return nil, err
	}
	return permits, nil
}

func AddWorkPermitMongo(wp WorkPermitMongo) (*WorkPermitMongo, error) {
	ctx := context.Background()
	result, err := WorkPermitsCollection().InsertOne(ctx, wp)
	if err != nil {
		return nil, err
	}
	wp.ID = result.InsertedID.(primitive.ObjectID)
	return &wp, nil
}

func UpdateWorkPermitStatus(id string, status string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = WorkPermitsCollection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": status}})
	return err
}

func GetWorkPermitByIDMongo(id string) (*WorkPermitMongo, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var wp WorkPermitMongo
	err = WorkPermitsCollection().FindOne(ctx, bson.M{"_id": objID}).Decode(&wp)
	if err != nil {
		return nil, err
	}
	return &wp, nil
}

func DeleteWorkPermitMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = WorkPermitsCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

func DeletePendingRequestByRefID(refID string) error {
	ctx := context.Background()
	_, err := PendingRequestsCollection().DeleteOne(ctx, bson.M{"ref_id": refID})
	return err
}

func DeleteWorkPermitsByUser(userID string) error {
	ctx := context.Background()
	_, err := WorkPermitsCollection().DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

// --- Leave Quota ---
func GetLeaveQuotaMongo(userID string, year int) (*LeaveQuotaMongo, error) {
	ctx := context.Background()
	var quota LeaveQuotaMongo
	err := LeaveQuotasCollection().FindOne(ctx, bson.M{"user_id": userID, "year": year}).Decode(&quota)
	if err != nil {
		// Return default if not found
		return &LeaveQuotaMongo{UserID: userID, Year: year, Total: 12, Used: 0, Remaining: 12}, nil
	}
	return &quota, nil
}

func UpdateLeaveQuotaMongo(quota LeaveQuotaMongo) error {
	ctx := context.Background()
	filter := bson.M{"user_id": quota.UserID, "year": quota.Year}
	update := bson.M{"$set": quota}
	opts := options.Update().SetUpsert(true)
	_, err := LeaveQuotasCollection().UpdateOne(ctx, filter, update, opts)
	return err
}

// ResetAllLeaveQuotas deletes all leave quota records so users get fresh default values (12 days)
func ResetAllLeaveQuotas(year int) (int64, error) {
	ctx := context.Background()
	result, err := LeaveQuotasCollection().DeleteMany(ctx, bson.M{"year": year})
	if err != nil {
		return 0, err
	}
	return result.DeletedCount, nil
}

func DeleteLeaveQuotaByUser(userID string) error {
	ctx := context.Background()
	_, err := LeaveQuotasCollection().DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

// --- Pending Requests ---
func GetPendingRequestsMongo() ([]PendingRequestMongo, error) {
	ctx := context.Background()
	cursor, err := PendingRequestsCollection().Find(ctx, bson.M{"status": "pending"})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var requests []PendingRequestMongo
	if err = cursor.All(ctx, &requests); err != nil {
		return nil, err
	}
	return requests, nil
}

func AddPendingRequestMongo(req PendingRequestMongo) (*PendingRequestMongo, error) {
	ctx := context.Background()
	result, err := PendingRequestsCollection().InsertOne(ctx, req)
	if err != nil {
		return nil, err
	}
	req.ID = result.InsertedID.(primitive.ObjectID)
	return &req, nil
}

func GetUserNotificationsMongo(userID string) ([]PendingRequestMongo, error) {
	ctx := context.Background()
	// Get resolved requests for this user (approved or rejected)
	filter := bson.M{
		"user_id": userID,
		"status":  bson.M{"$in": []string{"approved", "rejected"}},
	}
	cursor, err := PendingRequestsCollection().Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var requests []PendingRequestMongo
	if err = cursor.All(ctx, &requests); err != nil {
		return nil, err
	}
	return requests, nil
}

func DeletePendingRequestsByUser(userID string) error {
	ctx := context.Background()
	_, err := PendingRequestsCollection().DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

func GetPendingRequestByID(id string) (*PendingRequestMongo, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var req PendingRequestMongo
	err = PendingRequestsCollection().FindOne(ctx, bson.M{"_id": objID}).Decode(&req)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func UpdateRequestStatusMongo(id string, status string, rejectReason string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = PendingRequestsCollection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": status, "reject_reason": rejectReason}})
	return err
}

// --- Branches ---
func GetBranchesMongo() ([]BranchMongo, error) {
	ctx := context.Background()
	cursor, err := BranchesCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var branches []BranchMongo
	if err = cursor.All(ctx, &branches); err != nil {
		return nil, err
	}
	return branches, nil
}

func CreateBranchMongo(branch BranchMongo) (*BranchMongo, error) {
	ctx := context.Background()
	result, err := BranchesCollection().InsertOne(ctx, branch)
	if err != nil {
		return nil, err
	}
	branch.ID = result.InsertedID.(primitive.ObjectID)
	return &branch, nil
}

func DeleteBranchMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = BranchesCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

func UpdateBranchMongo(id string, branch BranchMongo) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = BranchesCollection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{
		"name":   branch.Name,
		"region": branch.Region,
	}})
	return err
}

// --- Calendar Events CRUD ---
func GetCalendarEventsMongo() ([]CalendarEventMongo, error) {
	ctx := context.Background()
	cursor, err := CalendarEventsCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var events []CalendarEventMongo
	if err = cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	return events, nil
}

func CreateCalendarEventMongo(event CalendarEventMongo) (*CalendarEventMongo, error) {
	ctx := context.Background()
	result, err := CalendarEventsCollection().InsertOne(ctx, event)
	if err != nil {
		return nil, err
	}
	event.ID = result.InsertedID.(primitive.ObjectID)
	return &event, nil
}

func DeleteCalendarEventMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = CalendarEventsCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// --- Stats ---
func GetStatsMongo() (map[string]interface{}, error) {
	ctx := context.Background()

	usersCount, _ := UsersCollection().CountDocuments(ctx, bson.M{})
	employeesCount, _ := EmployeesCollection().CountDocuments(ctx, bson.M{})
	attendanceCount, _ := AttendanceCollection().CountDocuments(ctx, bson.M{})
	workPermitsCount, _ := WorkPermitsCollection().CountDocuments(ctx, bson.M{})
	pendingCount, _ := PendingRequestsCollection().CountDocuments(ctx, bson.M{"status": "pending"})

	return map[string]interface{}{
		"total_users":        usersCount,
		"total_employees":    employeesCount,
		"total_attendance":   attendanceCount,
		"total_work_permits": workPermitsCount,
		"pending_permits":    pendingCount,
	}, nil
}

// --- Awards CRUD ---
func GetAllAwardsMongo() ([]AwardMongo, error) {
	ctx := context.Background()
	cursor, err := AwardsCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var awards []AwardMongo
	if err = cursor.All(ctx, &awards); err != nil {
		return nil, err
	}
	return awards, nil
}

func CreateAwardMongo(award AwardMongo) (*AwardMongo, error) {
	ctx := context.Background()
	result, err := AwardsCollection().InsertOne(ctx, award)
	if err != nil {
		return nil, err
	}
	award.ID = result.InsertedID.(primitive.ObjectID)
	return &award, nil
}

func DeleteAwardMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = AwardsCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

func DeleteAwardsByUser(userID string) error {
	ctx := context.Background()
	_, err := AwardsCollection().DeleteMany(ctx, bson.M{"user_id": userID})
	return err
}

// --- School CRUD ---

func GetSchoolsMongo() ([]SchoolMongo, error) {
	ctx := context.Background()
	cursor, err := SchoolsCollection().Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var schools []SchoolMongo
	if err = cursor.All(ctx, &schools); err != nil {
		return nil, err
	}
	return schools, nil
}

func CreateSchoolMongo(school SchoolMongo) (*SchoolMongo, error) {
	ctx := context.Background()
	result, err := SchoolsCollection().InsertOne(ctx, school)
	if err != nil {
		return nil, err
	}
	school.ID = result.InsertedID.(primitive.ObjectID)
	return &school, nil
}

func UpdateSchoolMongo(id string, school SchoolMongo) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = SchoolsCollection().UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": school})
	return err
}

func DeleteSchoolMongo(id string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = SchoolsCollection().DeleteOne(ctx, bson.M{"_id": objID})
	return err
}

// --- Cleanup Functions ---

// ClearUserBranchID clears branch_id from all users who have the specified branch_id
func ClearUserBranchID(branchID string) error {
	ctx := context.Background()
	_, err := UsersCollection().UpdateMany(ctx, bson.M{"branch_id": branchID}, bson.M{"$set": bson.M{"branch_id": ""}})
	return err
}

// CleanupExpiredLeaveAttendance - DISABLED: Leave records should be kept for history
// This was incorrectly deleting leave records after they passed, causing calendar dots to disappear
// If cleanup is needed, only remove records older than 2 years, not recent history
func CleanupExpiredLeaveAttendance() (int64, error) {
	// Disabled - do not delete leave history
	return 0, nil
}

// CleanupOldSupportFiles clears supporting_file from work permits older than 30 days
func CleanupOldSupportFiles() (int64, error) {
	ctx := context.Background()
	thirtyDaysAgo := time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	result, err := WorkPermitsCollection().UpdateMany(ctx,
		bson.M{
			"supporting_file": bson.M{"$ne": ""},
			"date":            bson.M{"$lt": thirtyDaysAgo},
		},
		bson.M{"$set": bson.M{"supporting_file": ""}})
	if err != nil {
		return 0, err
	}
	return result.ModifiedCount, nil
}
