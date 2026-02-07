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

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string        `json:"token"`
	User  database.User `json:"user"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email dan password harus diisi"})
		return
	}

	user := database.DB.GetUserByEmail(req.Email)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email atau password salah"})
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"email":    user.Email,
		"is_admin": user.IsAdmin,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	// Return user without password
	safeUser := database.User{
		ID:      user.ID,
		Email:   user.Email,
		Name:    user.Name,
		Role:    user.Role,
		IsAdmin: user.IsAdmin,
	}

	c.JSON(http.StatusOK, LoginResponse{
		Token: tokenString,
		User:  safeUser,
	})
}

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Berhasil logout"})
}

func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	user := database.DB.GetUserByID(userID.(uint))
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	employee := database.DB.GetEmployeeByUserID(user.ID)

	safeUser := database.User{
		ID:      user.ID,
		Email:   user.Email,
		Name:    user.Name,
		Role:    user.Role,
		IsAdmin: user.IsAdmin,
	}

	c.JSON(http.StatusOK, gin.H{
		"user":     safeUser,
		"employee": employee,
	})
}

// JWT Middleware
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		c.Set("user_id", uint(claims["user_id"].(float64)))
		c.Set("is_admin", claims["is_admin"].(bool))
		c.Next()
	}
}

// Admin Middleware
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("is_admin")
		if !exists || !isAdmin.(bool) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
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
			"id":       user.ID.Hex(),
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
			"is_admin": user.IsAdmin,
		},
	})
}

// Change Password endpoint
type ChangePasswordRequest struct {
	Email       string `json:"email" binding:"required"`
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak lengkap"})
		return
	}

	// Use MongoDB function
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

	// Update password using MongoDB
	user.Password = string(hashedPassword)
	err = database.UpdateUserMongo(user.ID.Hex(), *user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah"})
}
