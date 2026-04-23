package database

import "context"

func GetAttendanceByUser(userID string) ([]AttendanceMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,user_id,date,activity_type,activity_categories,activity_details,starting_time,ending_time,activity_docs,activity_notes,session,status,created_at FROM attendance WHERE user_id=$1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var records []AttendanceMongo
	for rows.Next() {
		var a AttendanceMongo
		if err := rows.Scan(&a.ID, &a.UserID, &a.Date, &a.ActivityType, &a.ActivityCategories, &a.ActivityDetails, &a.StartingTime, &a.EndingTime, &a.ActivityDocs, &a.ActivityNotes, &a.Session, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, a)
	}
	return records, nil
}

func GetAllAttendanceRecordsMongo() ([]AttendanceMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,user_id,date,activity_type,activity_categories,activity_details,starting_time,ending_time,activity_docs,activity_notes,session,status,created_at FROM attendance`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var records []AttendanceMongo
	for rows.Next() {
		var a AttendanceMongo
		if err := rows.Scan(&a.ID, &a.UserID, &a.Date, &a.ActivityType, &a.ActivityCategories, &a.ActivityDetails, &a.StartingTime, &a.EndingTime, &a.ActivityDocs, &a.ActivityNotes, &a.Session, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, a)
	}
	return records, nil
}

func AddAttendanceMongo(att AttendanceMongo) (*AttendanceMongo, error) {
	att.ID = newUUID()
	if att.ActivityCategories == nil {
		att.ActivityCategories = []string{}
	}
	_, err := pool.Exec(context.Background(),
		`INSERT INTO attendance (id,user_id,date,activity_type,activity_categories,activity_details,starting_time,ending_time,activity_docs,activity_notes,session,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		att.ID, att.UserID, att.Date, att.ActivityType, att.ActivityCategories, att.ActivityDetails, att.StartingTime, att.EndingTime, att.ActivityDocs, att.ActivityNotes, att.Session, att.Status, att.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &att, nil
}

func DeleteAttendanceMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM attendance WHERE id=$1`, id)
	return err
}

func DeleteAttendanceByUser(userID string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM attendance WHERE user_id=$1`, userID)
	return err
}
