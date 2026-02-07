package handlers

import (
	"kkhris-clone/database"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// --- Auth Handlers ---

func LoginMongo(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := database.GetUserByEmail(input.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID.Hex(),
		"email":    user.Email,
		"role":     user.Role,
		"is_admin": user.IsAdmin,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":       user.ID.Hex(),
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
			"is_admin": user.IsAdmin,
		},
	})
}

func AuthMiddlewareMongo() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		c.Set("userID", claims["user_id"].(string))
		c.Set("email", claims["email"].(string))
		c.Set("role", claims["role"].(string))
		c.Set("isAdmin", claims["is_admin"].(bool))
		c.Next()
	}
}

func AdminMiddlewareMongo() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("isAdmin")
		if !exists || !isAdmin.(bool) {
			role, _ := c.Get("role")
			if role != "manager" {
				c.JSON(http.StatusForbidden, gin.H{"error": "Admin or Manager access required"})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

func GetCurrentUserMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	user, err := database.GetUserByIDMongo(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID.Hex(),
		"email":    user.Email,
		"name":     user.Name,
		"role":     user.Role,
		"is_admin": user.IsAdmin,
	})
}

func GetUserProfileMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	user, err := database.GetUserByIDMongo(userID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":              user.ID.Hex(),
		"email":           user.Email,
		"name":            user.Name,
		"role":            user.Role,
		"is_admin":        user.IsAdmin,
		"center":          user.Center,
		"roles":           user.Roles,
		"photo_url":       user.PhotoURL,
		"branch_id":       user.BranchID,
		"sex":             user.Sex,
		"pob":             user.PoB,
		"dob":             user.DoB,
		"age":             user.Age,
		"religion":        user.Religion,
		"phone":           user.Phone,
		"address1":        user.Address1,
		"nik":             user.NIK,
		"npwp":            user.NPWP,
		"education_level": user.EducationLevel,
		"institution":     user.Institution,
		"major":           user.Major,
		"graduation_year": user.GraduationYear,
		"bank_account":    user.BankAccount,
		"status_ptkp":     user.StatusPTKP,
		"jabatan":         user.Jabatan,
	})
}

// --- Attendance Handlers ---

func GetAttendanceMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	records, err := database.GetAttendanceByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}

func GetAttendanceCalendarMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	records, err := database.GetAttendanceByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to calendar format
	events := []gin.H{}
	for _, r := range records {
		events = append(events, gin.H{
			"id":    r.ID.Hex(),
			"date":  r.Date,
			"title": r.ActivityType,
			"type":  r.Session,
		})
	}

	c.JSON(http.StatusOK, events)
}

func AddAttendanceMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	var input struct {
		Date               string   `json:"date" binding:"required"`
		ActivityType       string   `json:"activity_type" binding:"required"`
		ActivityCategories []string `json:"activity_categories"`
		ActivityDetails    string   `json:"activity_details"`
		StartingTime       string   `json:"starting_time"`
		EndingTime         string   `json:"ending_time"`
		ActivityDocs       string   `json:"activity_docs"`
		ActivityNotes      string   `json:"activity_notes"`
		Session            string   `json:"session"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	att := database.AttendanceMongo{
		UserID:             userID,
		Date:               input.Date,
		ActivityType:       input.ActivityType,
		ActivityCategories: input.ActivityCategories,
		ActivityDetails:    input.ActivityDetails,
		StartingTime:       input.StartingTime,
		EndingTime:         input.EndingTime,
		ActivityDocs:       input.ActivityDocs,
		ActivityNotes:      input.ActivityNotes,
		Session:            input.Session,
		Status:             "present",
		CreatedAt:          time.Now().Format("2006-01-02 15:04:05"),
	}

	created, err := database.AddAttendanceMongo(att)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

// --- Employee Handlers ---

func GetEmployeesMongo(c *gin.Context) {
	employees, err := database.GetAllEmployeesMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, employees)
}

func GetAttendanceRecapMongo(c *gin.Context) {
	// Get all attendance records with user names
	records, err := database.GetAllAttendanceRecordsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Map to include user names
	var result []gin.H
	userCache := make(map[string]string)

	for _, r := range records {
		userName := ""
		if cached, ok := userCache[r.UserID]; ok {
			userName = cached
		} else {
			user, err := database.GetUserByIDMongo(r.UserID)
			if err == nil && user != nil {
				userName = user.Name
				userCache[r.UserID] = userName
			}
		}

		result = append(result, gin.H{
			"id":                  r.ID.Hex(),
			"user_id":             r.UserID,
			"user_name":           userName,
			"date":                r.Date,
			"session":             r.Session,
			"status":              r.Status,
			"activity_type":       r.ActivityType,
			"activity_categories": r.ActivityCategories,
			"activity_details":    r.ActivityDetails,
			"activity_notes":      r.ActivityNotes,
			"starting_time":       r.StartingTime,
			"ending_time":         r.EndingTime,
			"check_in":            r.StartingTime,
			"check_out":           r.EndingTime,
		})
	}

	c.JSON(http.StatusOK, result)
}

func GetEmployeeMongo(c *gin.Context) {
	// For now, return empty - needs implementation
	c.JSON(http.StatusOK, gin.H{})
}

// --- Announcements Handlers ---

func GetAnnouncementsMongo(c *gin.Context) {
	announcements, err := database.GetAnnouncementsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func CreateAnnouncementMongo(c *gin.Context) {
	var input struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ann := database.AnnouncementMongo{
		Title:     input.Title,
		Content:   input.Content,
		IsActive:  true,
		CreatedAt: time.Now().Format("2006-01-02"),
	}

	created, err := database.CreateAnnouncementMongo(ann)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func DeleteAnnouncementMongo(c *gin.Context) {
	id := c.Param("id")

	err := database.DeleteAnnouncementMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted"})
}

// --- Calendar Events Handlers ---

func GetCalendarEventsMongo(c *gin.Context) {
	events, err := database.GetCalendarEventsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func CreateCalendarEventMongo(c *gin.Context) {
	var input struct {
		Date  string `json:"date" binding:"required"`
		Type  string `json:"type" binding:"required"`
		Title string `json:"title" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := database.CalendarEventMongo{
		Date:      input.Date,
		Type:      input.Type,
		Title:     input.Title,
		CreatedAt: time.Now().Format("2006-01-02"),
	}

	created, err := database.CreateCalendarEventMongo(event)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func DeleteCalendarEventMongo(c *gin.Context) {
	id := c.Param("id")

	err := database.DeleteCalendarEventMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Calendar event deleted"})
}

// --- Awards Handlers ---

func GetAwardsMongo(c *gin.Context) {
	awards, err := database.GetAllAwardsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if awards == nil {
		awards = []database.AwardMongo{}
	}
	c.JSON(http.StatusOK, awards)
}

func CreateAwardMongo(c *gin.Context) {
	var input struct {
		UserID   string `json:"user_id" binding:"required"`
		UserName string `json:"user_name" binding:"required"`
		Title    string `json:"title" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	award := database.AwardMongo{
		UserID:    input.UserID,
		UserName:  input.UserName,
		Title:     input.Title,
		Date:      time.Now().Format("2006-01-02"),
		CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
	}

	created, err := database.CreateAwardMongo(award)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func DeleteAwardMongo(c *gin.Context) {
	id := c.Param("id")

	err := database.DeleteAwardMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Award deleted"})
}

// --- Work Permits Handlers ---

func GetWorkPermitsMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	permits, err := database.GetWorkPermitsByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, permits)
}

func AddWorkPermitMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	var input struct {
		Date           string `json:"date" binding:"required"`
		Session        string `json:"session" binding:"required"`
		LeaveType      string `json:"leave_type" binding:"required"`
		Reason         string `json:"reason" binding:"required"`
		SupportingFile string `json:"supporting_file"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Block Annual/Personal leave when quota is exhausted
	// Annual and Personal leaves consume quota (Sick does not)
	if input.LeaveType == "Annual" || input.LeaveType == "Personal" {
		quota, _ := database.GetLeaveQuotaMongo(userID, time.Now().Year())
		if quota.Remaining <= 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Jatah cuti tahunan Anda sudah habis! Tidak dapat mengajukan cuti/izin."})
			return
		}
	}

	// Require supporting file for sick leave
	if input.LeaveType == "Sakit" && input.SupportingFile == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File pendukung (surat dokter) wajib diisi untuk izin Sakit"})
		return
	}

	wp := database.WorkPermitMongo{
		UserID:         userID,
		Date:           input.Date,
		Session:        input.Session,
		LeaveType:      input.LeaveType,
		Reason:         input.Reason,
		SupportingFile: input.SupportingFile,
		Status:         "pending",
	}

	created, err := database.AddWorkPermitMongo(wp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Also add to pending requests
	user, _ := database.GetUserByIDMongo(userID)
	userName := "Unknown"
	if user != nil {
		userName = user.Name
	}

	req := database.PendingRequestMongo{
		Type:           "work_permit",
		UserID:         userID,
		UserName:       userName,
		Date:           input.Date,
		Reason:         input.Reason,
		Details:        input.LeaveType + " - " + input.Session,
		Status:         "pending",
		CreatedAt:      time.Now().Format("2006-01-02"),
		RefID:          created.ID.Hex(),
		SupportingFile: input.SupportingFile,
	}
	database.AddPendingRequestMongo(req)

	c.JSON(http.StatusCreated, created)
}

func DeleteUserWorkPermitMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	permitID := c.Param("id")

	// Get the work permit to verify ownership and status
	wp, err := database.GetWorkPermitByIDMongo(permitID)
	if err != nil || wp == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Work permit not found"})
		return
	}

	// Verify that the user owns this work permit
	if wp.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own work permits"})
		return
	}

	// Only allow deletion of pending work permits
	if wp.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only pending work permits can be deleted"})
		return
	}

	// Delete the work permit
	err = database.DeleteWorkPermitMongo(permitID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Also delete the associated pending request
	database.DeletePendingRequestByRefID(permitID)

	c.JSON(http.StatusOK, gin.H{"message": "Work permit deleted"})
}

// --- Leave Quota Handlers ---

func GetLeaveQuotaMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)
	year := time.Now().Year()

	quota, err := database.GetLeaveQuotaMongo(userID, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, quota)
}

func GetUserNotificationsMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	notifications, err := database.GetUserNotificationsMongo(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

// --- Pending Requests Handlers ---

func GetPendingRequestsMongo(c *gin.Context) {
	requests, err := database.GetPendingRequestsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, requests)
}

func AddPendingRequestMongo(c *gin.Context) {
	userID := c.MustGet("userID").(string)

	var input struct {
		Type    string `json:"type" binding:"required"`
		Date    string `json:"date" binding:"required"`
		Reason  string `json:"reason" binding:"required"`
		Details string `json:"details"`
		RefID   string `json:"ref_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, _ := database.GetUserByIDMongo(userID)
	userName := "Unknown"
	if user != nil {
		userName = user.Name
	}

	req := database.PendingRequestMongo{
		Type:      input.Type,
		UserID:    userID,
		UserName:  userName,
		Date:      input.Date,
		Reason:    input.Reason,
		Details:   input.Details,
		Status:    "pending",
		CreatedAt: time.Now().Format("2006-01-02"),
		RefID:     input.RefID,
	}

	created, err := database.AddPendingRequestMongo(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func ApproveRequestMongo(c *gin.Context) {
	id := c.Param("id")

	// Get request details first
	req, err := database.GetPendingRequestByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Handle based on request type
	if req.Type == "delete_attendance" && req.RefID != "" {
		// Delete the attendance
		if err := database.DeleteAttendanceMongo(req.RefID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete attendance: " + err.Error()})
			return
		}
	} else if req.Type == "work_permit" && req.RefID != "" {
		// Update work permit status
		if err := database.UpdateWorkPermitStatus(req.RefID, "approved"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work permit: " + err.Error()})
			return
		}

		// Get work permit details to create attendance record with proper status
		wp, _ := database.GetWorkPermitByIDMongo(req.RefID)
		if wp != nil {
			status := "ijin" // default for Cuti, Izin Lainnya
			if wp.LeaveType == "Sakit" || wp.LeaveType == "Sick" {
				status = "sakit"
			}

			att := database.AttendanceMongo{
				UserID:       req.UserID,
				Date:         req.Date,
				ActivityType: wp.LeaveType,
				Session:      wp.Session,
				Status:       status,
				CreatedAt:    time.Now().Format("2006-01-02 15:04:05"),
			}
			database.AddAttendanceMongo(att)
		}

		// Decrease leave quota only if Full Day AND not sick leave
		// Details format: "LeaveType - Session"
		isHalfDay := strings.Contains(req.Details, "Half Day")
		isSickLeave := strings.Contains(req.Details, "Sick") || strings.Contains(req.Details, "Sakit") || req.Reason == "Sakit"
		if !isHalfDay && !isSickLeave {
			quota, _ := database.GetLeaveQuotaMongo(req.UserID, 2026)
			quota.Used++
			quota.Remaining = quota.Total - quota.Used
			database.UpdateLeaveQuotaMongo(*quota)
		}
	}

	// Update request status
	err = database.UpdateRequestStatusMongo(id, "approved", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request approved"})
}

func RejectRequestMongo(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
		return
	}

	// Get request details first
	req, err := database.GetPendingRequestByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Update work permit status if applicable
	if req.Type == "work_permit" && req.RefID != "" {
		if err := database.UpdateWorkPermitStatus(req.RefID, "rejected"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work permit: " + err.Error()})
			return
		}
	}

	// Update request status
	err = database.UpdateRequestStatusMongo(id, "rejected", input.Reason)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request rejected"})
}

// --- Admin Handlers ---

func GetAdminStatsMongo(c *gin.Context) {
	stats, err := database.GetStatsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func GetAllUsersMongo(c *gin.Context) {
	users, err := database.GetAllUsersMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

func CreateUserMongo(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Role     string `json:"role" binding:"required"`
		IsAdmin  bool   `json:"is_admin"`
		// Employee profile fields (optional during creation)
		Center          string `json:"center"`
		Roles           string `json:"roles"`
		PhotoURL        string `json:"photo_url"`
		BranchID        string `json:"branch_id"`
		Sex             string `json:"sex"`
		PoB             string `json:"pob"`
		DoB             string `json:"dob"`
		Age             int    `json:"age"`
		Religion        string `json:"religion"`
		Phone           string `json:"phone"`
		Address1        string `json:"address1"`
		NIK             string `json:"nik"`
		NPWP            string `json:"npwp"`
		EducationLevel  string `json:"education_level"`
		Institution     string `json:"institution"`
		Major           string `json:"major"`
		GraduationYear  int    `json:"graduation_year"`
		BankAccount     string `json:"bank_account"`
		StatusPTKP      string `json:"status_ptkp"`
		Jabatan         string `json:"jabatan"`
		ShowInDirectory bool   `json:"show_in_directory"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPass, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := database.UserMongo{
		Email:           input.Email,
		Password:        string(hashedPass),
		Name:            input.Name,
		Role:            input.Role,
		IsAdmin:         input.IsAdmin,
		Center:          input.Center,
		Roles:           input.Roles,
		PhotoURL:        input.PhotoURL,
		BranchID:        input.BranchID,
		Sex:             input.Sex,
		PoB:             input.PoB,
		DoB:             input.DoB,
		Age:             input.Age,
		Religion:        input.Religion,
		Phone:           input.Phone,
		Address1:        input.Address1,
		NIK:             input.NIK,
		NPWP:            input.NPWP,
		EducationLevel:  input.EducationLevel,
		Institution:     input.Institution,
		Major:           input.Major,
		GraduationYear:  input.GraduationYear,
		BankAccount:     input.BankAccount,
		StatusPTKP:      input.StatusPTKP,
		Jabatan:         input.Jabatan,
		ShowInDirectory: input.ShowInDirectory,
	}

	created, err := database.CreateUserMongo(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       created.ID.Hex(),
		"email":    created.Email,
		"name":     created.Name,
		"role":     created.Role,
		"is_admin": created.IsAdmin,
	})
}

func UpdateUserMongo(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Email           string `json:"email"`
		Name            string `json:"name"`
		Role            string `json:"role"`
		IsAdmin         bool   `json:"is_admin"`
		Center          string `json:"center"`
		Roles           string `json:"roles"`
		PhotoURL        string `json:"photo_url"`
		BranchID        string `json:"branch_id"`
		Sex             string `json:"sex"`
		PoB             string `json:"pob"`
		DoB             string `json:"dob"`
		Age             int    `json:"age"`
		Religion        string `json:"religion"`
		Phone           string `json:"phone"`
		Address1        string `json:"address1"`
		NIK             string `json:"nik"`
		NPWP            string `json:"npwp"`
		EducationLevel  string `json:"education_level"`
		Institution     string `json:"institution"`
		Major           string `json:"major"`
		GraduationYear  int    `json:"graduation_year"`
		BankAccount     string `json:"bank_account"`
		StatusPTKP      string `json:"status_ptkp"`
		Jabatan         string `json:"jabatan"`
		ShowInDirectory bool   `json:"show_in_directory"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing user to preserve password
	existingUser, err := database.GetUserByIDMongo(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user := database.UserMongo{
		Email:           input.Email,
		Password:        existingUser.Password, // Preserve existing password
		Name:            input.Name,
		Role:            input.Role,
		IsAdmin:         input.IsAdmin,
		Center:          input.Center,
		Roles:           input.Roles,
		PhotoURL:        input.PhotoURL,
		BranchID:        input.BranchID,
		Sex:             input.Sex,
		PoB:             input.PoB,
		DoB:             input.DoB,
		Age:             input.Age,
		Religion:        input.Religion,
		Phone:           input.Phone,
		Address1:        input.Address1,
		NIK:             input.NIK,
		NPWP:            input.NPWP,
		EducationLevel:  input.EducationLevel,
		Institution:     input.Institution,
		Major:           input.Major,
		GraduationYear:  input.GraduationYear,
		BankAccount:     input.BankAccount,
		StatusPTKP:      input.StatusPTKP,
		Jabatan:         input.Jabatan,
		ShowInDirectory: input.ShowInDirectory,
	}

	err = database.UpdateUserMongo(id, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User updated"})
}

func DeleteUserMongo(c *gin.Context) {
	id := c.Param("id")

	err := database.DeleteUserMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Cascade delete related data
	_ = database.DeleteAttendanceByUser(id)
	_ = database.DeleteWorkPermitsByUser(id)
	_ = database.DeletePendingRequestsByUser(id)
	_ = database.DeleteAwardsByUser(id)
	_ = database.DeleteLeaveQuotaByUser(id)

	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// --- Branch Handlers ---

func GetBranchesMongo(c *gin.Context) {
	branches, err := database.GetBranchesMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, branches)
}

func CreateBranchMongo(c *gin.Context) {
	var input struct {
		Name   string `json:"name" binding:"required"`
		Region string `json:"region" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	branch := database.BranchMongo{
		Name:   input.Name,
		Region: input.Region,
	}

	created, err := database.CreateBranchMongo(branch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":     created.ID.Hex(),
		"name":   created.Name,
		"region": created.Region,
	})
}

func DeleteBranchMongo(c *gin.Context) {
	id := c.Param("id")

	// First, clear branch_id from all users who have this branch
	database.ClearUserBranchID(id)

	err := database.DeleteBranchMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Branch deleted"})
}

func UpdateBranchMongo(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Name   string `json:"name" binding:"required"`
		Region string `json:"region" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	branch := database.BranchMongo{
		Name:   input.Name,
		Region: input.Region,
	}

	err := database.UpdateBranchMongo(id, branch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":      id,
		"name":    input.Name,
		"region":  input.Region,
		"message": "Branch updated",
	})
}

// --- Employee CRUD Handlers ---

func CreateEmployeeMongo(c *gin.Context) {
	var input struct {
		Name           string `json:"name" binding:"required"`
		Center         string `json:"center"`
		Roles          string `json:"roles"`
		Email          string `json:"email"`
		Phone          string `json:"phone"`
		PhotoURL       string `json:"photo_url"`
		BranchID       string `json:"branch_id"`
		Sex            string `json:"sex"`
		PoB            string `json:"pob"`
		DoB            string `json:"dob"`
		Age            int    `json:"age"`
		Religion       string `json:"religion"`
		Address1       string `json:"address1"`
		NIK            string `json:"nik"`
		NPWP           string `json:"npwp"`
		EducationLevel string `json:"education_level"`
		Institution    string `json:"institution"`
		Major          string `json:"major"`
		GraduationYear int    `json:"graduation_year"`
		BankAccount    string `json:"bank_account"`
		StatusPTKP     string `json:"status_ptkp"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	emp := database.EmployeeMongo{
		Name:           input.Name,
		Center:         input.Center,
		Roles:          input.Roles,
		PhotoURL:       input.PhotoURL,
		BranchID:       input.BranchID,
		Sex:            input.Sex,
		PoB:            input.PoB,
		DoB:            input.DoB,
		Age:            input.Age,
		Religion:       input.Religion,
		Phone:          input.Phone,
		Address1:       input.Address1,
		NIK:            input.NIK,
		NPWP:           input.NPWP,
		EducationLevel: input.EducationLevel,
		Institution:    input.Institution,
		Major:          input.Major,
		GraduationYear: input.GraduationYear,
		BankAccount:    input.BankAccount,
		StatusPTKP:     input.StatusPTKP,
	}

	created, err := database.CreateEmployeeMongo(emp)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func DeleteEmployeeMongo(c *gin.Context) {
	id := c.Param("id")

	err := database.DeleteEmployeeMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee deleted"})
}

// GetAdminLogsMongo returns recent system activity logs
func GetAdminLogsMongo(c *gin.Context) {
	logs := []gin.H{}

	// Get recent attendance records as logs
	attendances, _ := database.GetAllAttendanceRecordsMongo()
	userCache := make(map[string]string)

	// Take last 50 attendance records
	start := 0
	if len(attendances) > 50 {
		start = len(attendances) - 50
	}
	for i := len(attendances) - 1; i >= start; i-- {
		att := attendances[i]
		userName := ""
		if cached, ok := userCache[att.UserID]; ok {
			userName = cached
		} else {
			user, err := database.GetUserByIDMongo(att.UserID)
			if err == nil && user != nil {
				userName = user.Name
				userCache[att.UserID] = userName
			}
		}

		logType := "info"
		if att.Status == "absent" || att.Status == "alpha" {
			logType = "warning"
		} else if att.Status == "present" {
			logType = "success"
		}

		logs = append(logs, gin.H{
			"id":        att.ID.Hex(),
			"timestamp": att.CreatedAt,
			"type":      logType,
			"user_name": userName,
			"message":   "Attendance recorded: " + att.ActivityType + " - " + att.Status,
			"details":   att.ActivityDetails,
		})
	}

	// Get recent work permits as logs
	workPermits, _ := database.GetAllWorkPermitsMongo()
	start = 0
	if len(workPermits) > 30 {
		start = len(workPermits) - 30
	}
	for i := len(workPermits) - 1; i >= start; i-- {
		wp := workPermits[i]
		userName := ""
		if cached, ok := userCache[wp.UserID]; ok {
			userName = cached
		} else {
			user, err := database.GetUserByIDMongo(wp.UserID)
			if err == nil && user != nil {
				userName = user.Name
				userCache[wp.UserID] = userName
			}
		}

		logType := "info"
		if wp.Status == "approved" {
			logType = "success"
		} else if wp.Status == "rejected" {
			logType = "error"
		} else if wp.Status == "pending" {
			logType = "warning"
		}

		logs = append(logs, gin.H{
			"id":        wp.ID.Hex(),
			"timestamp": wp.Date,
			"type":      logType,
			"user_name": userName,
			"message":   "Work permit " + wp.Status + ": " + wp.LeaveType + " - " + wp.Reason,
			"details":   wp.Session,
		})
	}

	// Sort logs by timestamp (newest first) - simple bubble sort for small arrays
	for i := 0; i < len(logs)-1; i++ {
		for j := 0; j < len(logs)-i-1; j++ {
			ts1, _ := logs[j]["timestamp"].(string)
			ts2, _ := logs[j+1]["timestamp"].(string)
			if ts1 < ts2 {
				logs[j], logs[j+1] = logs[j+1], logs[j]
			}
		}
	}

	// Limit to 100 most recent
	if len(logs) > 100 {
		logs = logs[:100]
	}

	c.JSON(http.StatusOK, logs)
}
