package handlers

import (
	"net/http"
	"strings"
	"time"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("kkhris-secret-key-2024")

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Berhasil logout"})
}

// Validate Token endpoint (for frontend auth check)
func ValidateToken(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"valid": false, "error": "Invalid token"})
		return
	}

	user, err := database.GetUserByIDMongo(userID.(string))
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"valid": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"user": gin.H{
			"id":       user.ID,
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
			"is_admin": user.IsAdmin,
		},
	})
}

// Change Password endpoint
func ChangePassword(c *gin.Context) {
	var req struct {
		Email       string `json:"email" binding:"required"`
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak lengkap"})
		return
	}

	user, err := database.GetUserByEmail(req.Email)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email tidak ditemukan"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password lama salah"})
		return
	}

	if len(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 6 karakter"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat password"})
		return
	}

	user.Password = string(hashedPassword)
	err = database.UpdateUserMongo(user.ID, *user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah"})
}

// Suppress unused import warnings
var _ = strings.TrimPrefix
var _ = time.Now
var _ = jwt.SigningMethodHS256
