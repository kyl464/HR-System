package database

import (
	"context"
	"time"
)

// --- Work Permits ---
func GetWorkPermitsByUser(userID string) ([]WorkPermitMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,user_id,date,session,leave_type,reason,supporting_file,status FROM work_permits WHERE user_id=$1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []WorkPermitMongo
	for rows.Next() {
		var w WorkPermitMongo
		if err := rows.Scan(&w.ID, &w.UserID, &w.Date, &w.Session, &w.LeaveType, &w.Reason, &w.SupportingFile, &w.Status); err != nil {
			return nil, err
		}
		list = append(list, w)
	}
	return list, nil
}

func GetAllWorkPermitsMongo() ([]WorkPermitMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,user_id,date,session,leave_type,reason,supporting_file,status FROM work_permits`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []WorkPermitMongo
	for rows.Next() {
		var w WorkPermitMongo
		if err := rows.Scan(&w.ID, &w.UserID, &w.Date, &w.Session, &w.LeaveType, &w.Reason, &w.SupportingFile, &w.Status); err != nil {
			return nil, err
		}
		list = append(list, w)
	}
	return list, nil
}

func AddWorkPermitMongo(wp WorkPermitMongo) (*WorkPermitMongo, error) {
	wp.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO work_permits (id,user_id,date,session,leave_type,reason,supporting_file,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		wp.ID, wp.UserID, wp.Date, wp.Session, wp.LeaveType, wp.Reason, wp.SupportingFile, wp.Status)
	if err != nil {
		return nil, err
	}
	return &wp, nil
}

func UpdateWorkPermitStatus(id string, status string) error {
	_, err := pool.Exec(context.Background(), `UPDATE work_permits SET status=$2 WHERE id=$1`, id, status)
	return err
}

func GetWorkPermitByIDMongo(id string) (*WorkPermitMongo, error) {
	var w WorkPermitMongo
	err := pool.QueryRow(context.Background(),
		`SELECT id,user_id,date,session,leave_type,reason,supporting_file,status FROM work_permits WHERE id=$1`, id).Scan(
		&w.ID, &w.UserID, &w.Date, &w.Session, &w.LeaveType, &w.Reason, &w.SupportingFile, &w.Status)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

func DeleteWorkPermitMongo(id string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM work_permits WHERE id=$1`, id)
	return err
}

func DeleteWorkPermitsByUser(userID string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM work_permits WHERE user_id=$1`, userID)
	return err
}

// --- Leave Quotas ---
func GetLeaveQuotaMongo(userID string, year int) (*LeaveQuotaMongo, error) {
	var q LeaveQuotaMongo
	err := pool.QueryRow(context.Background(),
		`SELECT id,user_id,year,total,used,remaining FROM leave_quotas WHERE user_id=$1 AND year=$2`, userID, year).Scan(
		&q.ID, &q.UserID, &q.Year, &q.Total, &q.Used, &q.Remaining)
	if err != nil {
		return &LeaveQuotaMongo{UserID: userID, Year: year, Total: 12, Used: 0, Remaining: 12}, nil
	}
	return &q, nil
}

func UpdateLeaveQuotaMongo(quota LeaveQuotaMongo) error {
	if quota.ID == "" {
		quota.ID = newUUID()
	}
	_, err := pool.Exec(context.Background(),
		`INSERT INTO leave_quotas (id,user_id,year,total,used,remaining) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (user_id,year) DO UPDATE SET total=$4,used=$5,remaining=$6`,
		quota.ID, quota.UserID, quota.Year, quota.Total, quota.Used, quota.Remaining)
	return err
}

func DeleteLeaveQuotaByUser(userID string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM leave_quotas WHERE user_id=$1`, userID)
	return err
}

// --- Pending Requests ---
func GetPendingRequestsMongo() ([]PendingRequestMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,type,user_id,user_name,date,reason,details,status,reject_reason,created_at,ref_id,supporting_file FROM pending_requests WHERE status='pending'`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []PendingRequestMongo
	for rows.Next() {
		var r PendingRequestMongo
		if err := rows.Scan(&r.ID, &r.Type, &r.UserID, &r.UserName, &r.Date, &r.Reason, &r.Details, &r.Status, &r.RejectReason, &r.CreatedAt, &r.RefID, &r.SupportingFile); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

func AddPendingRequestMongo(req PendingRequestMongo) (*PendingRequestMongo, error) {
	req.ID = newUUID()
	_, err := pool.Exec(context.Background(),
		`INSERT INTO pending_requests (id,type,user_id,user_name,date,reason,details,status,reject_reason,created_at,ref_id,supporting_file) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		req.ID, req.Type, req.UserID, req.UserName, req.Date, req.Reason, req.Details, req.Status, req.RejectReason, req.CreatedAt, req.RefID, req.SupportingFile)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func GetUserNotificationsMongo(userID string) ([]PendingRequestMongo, error) {
	rows, err := pool.Query(context.Background(),
		`SELECT id,type,user_id,user_name,date,reason,details,status,reject_reason,created_at,ref_id,supporting_file FROM pending_requests WHERE user_id=$1 AND status IN ('approved','rejected')`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []PendingRequestMongo
	for rows.Next() {
		var r PendingRequestMongo
		if err := rows.Scan(&r.ID, &r.Type, &r.UserID, &r.UserName, &r.Date, &r.Reason, &r.Details, &r.Status, &r.RejectReason, &r.CreatedAt, &r.RefID, &r.SupportingFile); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	return list, nil
}

func GetPendingRequestByID(id string) (*PendingRequestMongo, error) {
	var r PendingRequestMongo
	err := pool.QueryRow(context.Background(),
		`SELECT id,type,user_id,user_name,date,reason,details,status,reject_reason,created_at,ref_id,supporting_file FROM pending_requests WHERE id=$1`, id).Scan(
		&r.ID, &r.Type, &r.UserID, &r.UserName, &r.Date, &r.Reason, &r.Details, &r.Status, &r.RejectReason, &r.CreatedAt, &r.RefID, &r.SupportingFile)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func UpdateRequestStatusMongo(id string, status string, rejectReason string) error {
	_, err := pool.Exec(context.Background(), `UPDATE pending_requests SET status=$2,reject_reason=$3 WHERE id=$1`, id, status, rejectReason)
	return err
}

func DeletePendingRequestByRefID(refID string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM pending_requests WHERE ref_id=$1`, refID)
	return err
}

func DeletePendingRequestsByUser(userID string) error {
	_, err := pool.Exec(context.Background(), `DELETE FROM pending_requests WHERE user_id=$1`, userID)
	return err
}

// --- Stats ---
func GetStatsMongo() (map[string]interface{}, error) {
	ctx := context.Background()
	var usersCount, attendanceCount, workPermitsCount, pendingCount int64
	pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&usersCount)
	pool.QueryRow(ctx, `SELECT COUNT(*) FROM attendance`).Scan(&attendanceCount)
	pool.QueryRow(ctx, `SELECT COUNT(*) FROM work_permits`).Scan(&workPermitsCount)
	pool.QueryRow(ctx, `SELECT COUNT(*) FROM pending_requests WHERE status='pending'`).Scan(&pendingCount)
	return map[string]interface{}{
		"total_users":        usersCount,
		"total_employees":    usersCount,
		"total_attendance":   attendanceCount,
		"total_work_permits": workPermitsCount,
		"pending_permits":    pendingCount,
	}, nil
}

// --- Cleanup ---
func CleanupExpiredLeaveAttendance() (int64, error) {
	return 0, nil
}

func CleanupOldSupportFiles() (int64, error) {
	ctx := context.Background()
	thirtyDaysAgo := time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	tag, err := pool.Exec(ctx, `UPDATE work_permits SET supporting_file='' WHERE supporting_file!='' AND date<$1`, thirtyDaysAgo)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func CleanupOrphanedData() (int, error) {
	// With CASCADE deletes on FK, orphaned data is handled automatically
	return 0, nil
}
