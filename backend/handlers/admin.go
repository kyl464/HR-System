package handlers

import (
	"net/http"
	"strconv"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Get all users (admin only)
func GetAllUsers(c *gin.Context) {
	users := database.DB.GetAllUsers()
	c.JSON(http.StatusOK, users)
}

// Create user (admin only)
type CreateUserRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Role     string `json:"role"`
	IsAdmin  bool   `json:"is_admin"`
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check if email already exists
	existing := database.DB.GetUserByEmail(req.Email)
	if existing != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email sudah terdaftar"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat user"})
		return
	}

	user := database.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Role:     req.Role,
		IsAdmin:  req.IsAdmin,
	}

	if user.Role == "" {
		user.Role = "staff"
	}

	id := database.DB.AddUser(user)

	c.JSON(http.StatusCreated, gin.H{
		"message": "User berhasil dibuat",
		"id":      id,
	})
}

// Update user (admin only)
type UpdateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	IsAdmin  bool   `json:"is_admin"`
}

func UpdateUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	updates := database.User{
		Email:   req.Email,
		Name:    req.Name,
		Role:    req.Role,
		IsAdmin: req.IsAdmin,
	}

	// Hash new password if provided
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update password"})
			return
		}
		updates.Password = string(hashedPassword)
	}

	success := database.DB.UpdateUser(uint(id), updates)
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil diupdate"})
}

// Delete user (admin only)
func DeleteUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	// Prevent deleting yourself
	currentUserID, _ := c.Get("user_id")
	if uint(id) == currentUserID.(uint) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak bisa menghapus akun sendiri"})
		return
	}

	success := database.DB.DeleteUser(uint(id))
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil dihapus"})
}

// Get dashboard stats (admin only)
func GetAdminStats(c *gin.Context) {
	stats := gin.H{
		"total_users":         len(database.DB.Users),
		"total_employees":     len(database.DB.Employees),
		"total_attendance":    len(database.DB.Attendance),
		"total_work_permits":  len(database.DB.WorkPermits),
		"total_assignments":   len(database.DB.Assignments),
		"total_announcements": len(database.DB.Announcements),
	}
	c.JSON(http.StatusOK, stats)
}
