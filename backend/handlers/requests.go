package handlers

import (
	"kkhris-clone/database"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetLeaveQuota returns leave quota for current user
func GetLeaveQuota(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	year := time.Now().Year()

	quota := database.DB.GetLeaveQuota(userID, year)
	c.JSON(http.StatusOK, quota)
}

// GetPendingRequests returns all pending requests (admin/manager only)
func GetPendingRequests(c *gin.Context) {
	requests := database.DB.GetPendingRequests()
	c.JSON(http.StatusOK, requests)
}

// AddPendingRequest creates a new pending request
func AddPendingRequest(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var input struct {
		Type    string `json:"type" binding:"required"`
		Date    string `json:"date" binding:"required"`
		Reason  string `json:"reason" binding:"required"`
		Details string `json:"details"`
		RefID   uint   `json:"ref_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user name
	user := database.DB.GetUserByID(userID)
	userName := "Unknown"
	if user != nil {
		userName = user.Name
	}

	req := database.PendingRequest{
		Type:      input.Type,
		UserID:    userID,
		UserName:  userName,
		Date:      input.Date,
		Reason:    input.Reason,
		Details:   input.Details,
		CreatedAt: time.Now().Format("2006-01-02"),
		RefID:     input.RefID,
	}

	created := database.DB.AddPendingRequest(req)
	c.JSON(http.StatusCreated, created)
}

// ApproveRequest approves a pending request
func ApproveRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	success := database.DB.UpdateRequestStatus(uint(id), "approved", "")
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request approved"})
}

// RejectRequest rejects a pending request with reason
func RejectRequest(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var input struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required"})
		return
	}

	success := database.DB.UpdateRequestStatus(uint(id), "rejected", input.Reason)
	if !success {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request rejected"})
}
