package database

import (
	"encoding/json"
	"os"
	"sync"
)

var (
	mu sync.RWMutex
	db *Database
)

type Database struct {
	Users           []User           `json:"users"`
	Employees       []Employee       `json:"employees"`
	Attendance      []Attendance     `json:"attendance"`
	Announcements   []Announcement   `json:"announcements"`
	Awards          []Award          `json:"awards"`
	WorkPermits     []WorkPermit     `json:"work_permits"`
	Objectives      []Objective      `json:"objectives"`
	Assignments     []Assignment     `json:"assignments"`
	LeaveQuotas     []LeaveQuota     `json:"leave_quotas"`
	PendingRequests []PendingRequest `json:"pending_requests"`
}

// User model
type User struct {
	ID       uint   `json:"id"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	IsAdmin  bool   `json:"is_admin"`
}

// Employee model
type Employee struct {
	ID             uint   `json:"id"`
	UserID         uint   `json:"user_id"`
	Name           string `json:"name"`
	Center         string `json:"center"`
	Roles          string `json:"roles"`
	PhotoURL       string `json:"photo_url"`
	Sex            string `json:"sex"`
	PoB            string `json:"pob"`
	DoB            string `json:"dob"`
	Age            int    `json:"age"`
	Religion       string `json:"religion"`
	Phone          string `json:"phone"`
	Address1       string `json:"address1"`
	Address2       string `json:"address2"`
	NIK            string `json:"nik"`
	NPWP           string `json:"npwp"`
	EducationLevel string `json:"education_level"`
	Institution    string `json:"institution"`
	Major          string `json:"major"`
	GraduationYear int    `json:"graduation_year"`
	BankAccount    string `json:"bank_account"`
	StatusPTKP     string `json:"status_ptkp"`
}

// Attendance model - Updated with new fields
type Attendance struct {
	ID                 uint     `json:"id"`
	UserID             uint     `json:"user_id"`
	Date               string   `json:"date"`
	ActivityType       string   `json:"activity_type"`
	ActivityCategories []string `json:"activity_categories"`
	ActivityDetails    string   `json:"activity_details"`
	StartingTime       string   `json:"starting_time"`
	EndingTime         string   `json:"ending_time"`
	ActivityDocs       string   `json:"activity_docs"`
	ActivityNotes      string   `json:"activity_notes"`
	Session            string   `json:"session"`
	Status             string   `json:"status"`
	CreatedAt          string   `json:"created_at"`
}

// Announcement model
type Announcement struct {
	ID        uint   `json:"id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
}

// Award model
type Award struct {
	ID           uint   `json:"id"`
	Quarter      string `json:"quarter"`
	Year         int    `json:"year"`
	EmployeeName string `json:"employee_name"`
	AwardName    string `json:"award_name"`
}

// WorkPermit model
type WorkPermit struct {
	ID             uint   `json:"id"`
	UserID         uint   `json:"user_id"`
	Date           string `json:"date"`
	Session        string `json:"session"`
	LeaveType      string `json:"leave_type"`
	Reason         string `json:"reason"`
	SupportingFile string `json:"supporting_file"`
	Status         string `json:"status"`
}

// Objective model
type Objective struct {
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

// Assignment model
type Assignment struct {
	ID          uint   `json:"id"`
	UserID      uint   `json:"user_id"`
	ObjectiveID uint   `json:"objective_id"`
	Submission  string `json:"submission"`
	SubmittedAt string `json:"submitted_at"`
}

// LeaveQuota model - tracks annual leave quota per user
type LeaveQuota struct {
	ID        uint `json:"id"`
	UserID    uint `json:"user_id"`
	Year      int  `json:"year"`
	Total     int  `json:"total"`
	Used      int  `json:"used"`
	Remaining int  `json:"remaining"`
}

// PendingRequest model - for approval workflow
type PendingRequest struct {
	ID           uint   `json:"id"`
	Type         string `json:"type"` // work_permit, delete_attendance
	UserID       uint   `json:"user_id"`
	UserName     string `json:"user_name"`
	Date         string `json:"date"`
	Reason       string `json:"reason"`
	Details      string `json:"details"`
	Status       string `json:"status"` // pending, approved, rejected
	RejectReason string `json:"reject_reason"`
	CreatedAt    string `json:"created_at"`
	RefID        uint   `json:"ref_id"` // Reference to work_permit or attendance ID
}

var DB *Database

func InitDB() {
	db = &Database{}

	// Try to load from file
	data, err := os.ReadFile("data.json")
	if err == nil {
		json.Unmarshal(data, db)
	}

	DB = db
}

func SaveDB() error {
	mu.Lock()
	defer mu.Unlock()

	data, err := json.MarshalIndent(db, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile("data.json", data, 0644)
}

// Helper functions
func (d *Database) GetUserByEmail(email string) *User {
	mu.RLock()
	defer mu.RUnlock()

	for i := range d.Users {
		if d.Users[i].Email == email {
			return &d.Users[i]
		}
	}
	return nil
}

func (d *Database) GetUserByID(id uint) *User {
	mu.RLock()
	defer mu.RUnlock()

	for i := range d.Users {
		if d.Users[i].ID == id {
			return &d.Users[i]
		}
	}
	return nil
}

func (d *Database) GetEmployeeByUserID(userID uint) *Employee {
	mu.RLock()
	defer mu.RUnlock()

	for i := range d.Employees {
		if d.Employees[i].UserID == userID {
			return &d.Employees[i]
		}
	}
	return nil
}

func (d *Database) AddAttendance(att Attendance) {
	mu.Lock()
	defer mu.Unlock()

	att.ID = uint(len(d.Attendance) + 1)
	d.Attendance = append(d.Attendance, att)
	go SaveDB()
}

func (d *Database) AddWorkPermit(wp WorkPermit) {
	mu.Lock()
	defer mu.Unlock()

	wp.ID = uint(len(d.WorkPermits) + 1)
	d.WorkPermits = append(d.WorkPermits, wp)
	go SaveDB()
}

func (d *Database) AddAssignment(a Assignment) {
	mu.Lock()
	defer mu.Unlock()

	a.ID = uint(len(d.Assignments) + 1)
	d.Assignments = append(d.Assignments, a)
	go SaveDB()
}

func (d *Database) GetObjectiveByID(id uint) *Objective {
	mu.RLock()
	defer mu.RUnlock()

	for i := range d.Objectives {
		if d.Objectives[i].ID == id {
			return &d.Objectives[i]
		}
	}
	return nil
}

// User management for admin
func (d *Database) AddUser(user User) uint {
	mu.Lock()
	defer mu.Unlock()

	user.ID = uint(len(d.Users) + 1)
	d.Users = append(d.Users, user)
	go SaveDB()
	return user.ID
}

func (d *Database) UpdateUser(id uint, updates User) bool {
	mu.Lock()
	defer mu.Unlock()

	for i := range d.Users {
		if d.Users[i].ID == id {
			if updates.Name != "" {
				d.Users[i].Name = updates.Name
			}
			if updates.Email != "" {
				d.Users[i].Email = updates.Email
			}
			if updates.Password != "" {
				d.Users[i].Password = updates.Password
			}
			if updates.Role != "" {
				d.Users[i].Role = updates.Role
			}
			d.Users[i].IsAdmin = updates.IsAdmin
			go SaveDB()
			return true
		}
	}
	return false
}

func (d *Database) DeleteUser(id uint) bool {
	mu.Lock()
	defer mu.Unlock()

	for i := range d.Users {
		if d.Users[i].ID == id {
			d.Users = append(d.Users[:i], d.Users[i+1:]...)
			go SaveDB()
			return true
		}
	}
	return false
}

func (d *Database) GetAllUsers() []User {
	mu.RLock()
	defer mu.RUnlock()

	// Return users without passwords
	users := make([]User, len(d.Users))
	for i, u := range d.Users {
		users[i] = User{
			ID:      u.ID,
			Email:   u.Email,
			Name:    u.Name,
			Role:    u.Role,
			IsAdmin: u.IsAdmin,
		}
	}
	return users
}

// Leave Quota functions
func (d *Database) GetLeaveQuota(userID uint, year int) *LeaveQuota {
	mu.RLock()
	defer mu.RUnlock()

	for _, q := range d.LeaveQuotas {
		if q.UserID == userID && q.Year == year {
			return &q
		}
	}
	// Return default quota if not found
	return &LeaveQuota{UserID: userID, Year: year, Total: 12, Used: 0, Remaining: 12}
}

func (d *Database) UpdateLeaveQuota(quota LeaveQuota) {
	mu.Lock()
	defer mu.Unlock()

	for i := range d.LeaveQuotas {
		if d.LeaveQuotas[i].UserID == quota.UserID && d.LeaveQuotas[i].Year == quota.Year {
			d.LeaveQuotas[i] = quota
			go SaveDB()
			return
		}
	}
	// Create new if not exists
	quota.ID = uint(len(d.LeaveQuotas) + 1)
	d.LeaveQuotas = append(d.LeaveQuotas, quota)
	go SaveDB()
}

// Pending Request functions
func (d *Database) GetPendingRequests() []PendingRequest {
	mu.RLock()
	defer mu.RUnlock()

	pending := []PendingRequest{}
	for _, r := range d.PendingRequests {
		if r.Status == "pending" {
			pending = append(pending, r)
		}
	}
	return pending
}

func (d *Database) AddPendingRequest(req PendingRequest) PendingRequest {
	mu.Lock()
	defer mu.Unlock()

	req.ID = uint(len(d.PendingRequests) + 1)
	req.Status = "pending"
	d.PendingRequests = append(d.PendingRequests, req)
	go SaveDB()
	return req
}

func (d *Database) UpdateRequestStatus(id uint, status string, rejectReason string) bool {
	mu.Lock()
	defer mu.Unlock()

	for i := range d.PendingRequests {
		if d.PendingRequests[i].ID == id {
			d.PendingRequests[i].Status = status
			d.PendingRequests[i].RejectReason = rejectReason
			go SaveDB()
			return true
		}
	}
	return false
}
