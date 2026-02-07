package handlers

import (
	"net/http"
	"strings"
	"time"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
)

type AttendanceRequest struct {
	Date               string   `json:"date" binding:"required"`
	ActivityType       string   `json:"activity_type" binding:"required"`
	ActivityCategories []string `json:"activity_categories"`
	ActivityDetails    string   `json:"activity_details" binding:"required"`
	StartingTime       string   `json:"starting_time"`
	EndingTime         string   `json:"ending_time"`
	ActivityDocs       string   `json:"activity_docs"`
	ActivityNotes      string   `json:"activity_notes"`
}

func GetAttendance(c *gin.Context) {
	month := c.Query("month")
	year := c.Query("year")

	var filtered []database.Attendance
	for _, att := range database.DB.Attendance {
		if month != "" && year != "" {
			// Filter by month and year
			parts := strings.Split(att.Date, "-")
			if len(parts) >= 2 {
				if parts[0] == year && parts[1] == month {
					filtered = append(filtered, att)
				}
			}
		} else {
			filtered = append(filtered, att)
		}
	}

	c.JSON(http.StatusOK, filtered)
}

func GetAttendanceCalendar(c *gin.Context) {
	calendarData := make(map[string][]database.Attendance)
	for _, att := range database.DB.Attendance {
		calendarData[att.Date] = append(calendarData[att.Date], att)
	}

	c.JSON(http.StatusOK, calendarData)
}

func AddAttendance(c *gin.Context) {
	var req AttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		userID = uint(1) // Fallback for demo
	}

	// Determine session based on time
	session := "Full Day"
	if req.StartingTime != "" && req.EndingTime != "" {
		startHour := 0
		if len(req.StartingTime) >= 2 {
			startHour = int(req.StartingTime[0]-'0')*10 + int(req.StartingTime[1]-'0')
		}
		if startHour >= 12 {
			session = "Afternoon"
		} else {
			session = "Morning"
		}
	}

	attendance := database.Attendance{
		UserID:             userID.(uint),
		Date:               req.Date,
		ActivityType:       req.ActivityType,
		ActivityCategories: req.ActivityCategories,
		ActivityDetails:    req.ActivityDetails,
		StartingTime:       req.StartingTime,
		EndingTime:         req.EndingTime,
		ActivityDocs:       req.ActivityDocs,
		ActivityNotes:      req.ActivityNotes,
		Session:            session,
		Status:             "present",
		CreatedAt:          time.Now().Format(time.RFC3339),
	}

	database.DB.AddAttendance(attendance)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Absensi berhasil ditambahkan",
		"data":    attendance,
	})
}
