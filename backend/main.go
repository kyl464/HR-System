package main

import (
	"log"
	"os"
	"strings"

	"kkhris-clone/database"
	"kkhris-clone/handlers"
	"kkhris-clone/seed"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to MongoDB
	if err := database.ConnectMongoDB(); err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}

	// Seed initial data if empty
	seed.SeedMongoDB()

	// Run cleanup tasks on startup
	if deleted, err := database.CleanupExpiredLeaveAttendance(); err != nil {
		log.Printf("Cleanup expired leaves error: %v", err)
	} else if deleted > 0 {
		log.Printf("Cleaned up %d expired leave attendance records", deleted)
	}
	if cleared, err := database.CleanupOldSupportFiles(); err != nil {
		log.Printf("Cleanup old support files error: %v", err)
	} else if cleared > 0 {
		log.Printf("Cleared supporting files from %d old work permits", cleared)
	}

	if deleted, err := database.CleanupOrphanedData(); err != nil {
		log.Printf("Cleanup orphaned data error: %v", err)
	} else if deleted > 0 {
		log.Printf("Cleaned up %d orphaned records", deleted)
	}

	// Setup Gin
	r := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()

	// Read allowed origins from environment variable (comma-separated)
	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins != "" {
		config.AllowOrigins = strings.Split(corsOrigins, ",")
	} else {
		// Default fallback for local development
		config.AllowOrigins = []string{"http://localhost:3000"}
	}

	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	// Health check endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "HR System API is running",
		})
	})

	// Public routes (no auth required)
	api := r.Group("/api")
	{
		api.POST("/auth/login", handlers.LoginMongo)
		api.POST("/auth/logout", handlers.Logout)
		api.POST("/auth/change-password", handlers.ChangePassword)
	}

	// Protected routes (auth required)
	protected := r.Group("/api")
	protected.Use(handlers.AuthMiddlewareMongo())
	{
		// Auth
		protected.GET("/auth/me", handlers.GetCurrentUserMongo)
		protected.GET("/auth/validate", handlers.ValidateToken)

		// Attendance
		protected.GET("/attendance", handlers.GetAttendanceMongo)
		protected.GET("/attendance/calendar", handlers.GetAttendanceCalendarMongo)
		protected.POST("/attendance", handlers.AddAttendanceMongo)

		// Employees
		protected.GET("/employees", handlers.GetEmployeesMongo)
		protected.GET("/employees/:id", handlers.GetEmployeeMongo)

		// Announcements
		protected.GET("/announcements", handlers.GetAnnouncementsMongo)

		// Calendar Events (public read)
		protected.GET("/calendar-events", handlers.GetCalendarEventsMongo)

		// Branches (public read for directory)
		protected.GET("/branches", handlers.GetBranchesMongo)
		protected.GET("/awards", handlers.GetAwardsMongo)

		// Work Permits
		protected.GET("/work-permits", handlers.GetWorkPermitsMongo)
		protected.POST("/work-permits", handlers.AddWorkPermitMongo)
		protected.DELETE("/work-permits/:id", handlers.DeleteUserWorkPermitMongo)

		// Leave quota and requests
		protected.GET("/leave-quota", handlers.GetLeaveQuotaMongo)
		protected.GET("/notifications", handlers.GetUserNotificationsMongo)
		protected.POST("/requests", handlers.AddPendingRequestMongo)

		// User profile
		protected.GET("/profile", handlers.GetUserProfileMongo)

		// Leave list - accessible to all users to see who's on leave
		protected.GET("/attendance-recap", handlers.GetAttendanceRecapMongo)
	}

	// Admin routes (admin only)
	admin := r.Group("/api/admin")
	admin.Use(handlers.AuthMiddlewareMongo())
	admin.Use(handlers.AdminMiddlewareMongo())
	{
		admin.GET("/stats", handlers.GetAdminStatsMongo)
		admin.GET("/users", handlers.GetAllUsersMongo)
		admin.POST("/users", handlers.CreateUserMongo)
		admin.PUT("/users/:id", handlers.UpdateUserMongo)
		admin.DELETE("/users/:id", handlers.DeleteUserMongo)
		admin.GET("/requests", handlers.GetPendingRequestsMongo)
		admin.PUT("/requests/:id/approve", handlers.ApproveRequestMongo)
		admin.PUT("/requests/:id/reject", handlers.RejectRequestMongo)
		// Branches
		admin.GET("/branches", handlers.GetBranchesMongo)
		admin.POST("/branches", handlers.CreateBranchMongo)
		admin.PUT("/branches/:id", handlers.UpdateBranchMongo)
		admin.DELETE("/branches/:id", handlers.DeleteBranchMongo)
		// Employees
		admin.POST("/employees", handlers.CreateEmployeeMongo)
		admin.DELETE("/employees/:id", handlers.DeleteEmployeeMongo)
		// Announcements
		admin.POST("/announcements", handlers.CreateAnnouncementMongo)
		admin.DELETE("/announcements/:id", handlers.DeleteAnnouncementMongo)
		// Calendar Events
		admin.POST("/calendar-events", handlers.CreateCalendarEventMongo)
		admin.DELETE("/calendar-events/:id", handlers.DeleteCalendarEventMongo)
		// Attendance Recap
		admin.GET("/attendance-recap", handlers.GetAttendanceRecapMongo)
		// Logs
		admin.GET("/logs", handlers.GetAdminLogsMongo)
		// Awards
		admin.POST("/awards", handlers.CreateAwardMongo)
		admin.DELETE("/awards/:id", handlers.DeleteAwardMongo)
		// Schools
		admin.GET("/schools", handlers.GetSchoolsMongo)
		admin.POST("/schools", handlers.CreateSchoolMongo)
		admin.PUT("/schools/:id", handlers.UpdateSchoolMongo)
		admin.DELETE("/schools/:id", handlers.DeleteSchoolMongo)
	}

	log.Println("Server starting on :8080")
	r.Run(":8080")
}
