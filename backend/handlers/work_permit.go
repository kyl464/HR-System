package handlers

import (
	"net/http"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
)

type WorkPermitRequest struct {
	Date           string `json:"date" binding:"required"`
	Session        string `json:"session" binding:"required"`
	LeaveType      string `json:"leave_type" binding:"required"`
	Reason         string `json:"reason" binding:"required"`
	SupportingFile string `json:"supporting_file"`
}

func GetWorkPermits(c *gin.Context) {
	status := c.Query("status")
	leaveType := c.Query("leave_type")

	var filtered []database.WorkPermit
	for _, wp := range database.DB.WorkPermits {
		matchesStatus := status == "" || wp.Status == status
		matchesType := leaveType == "" || wp.LeaveType == leaveType

		if matchesStatus && matchesType {
			filtered = append(filtered, wp)
		}
	}

	c.JSON(http.StatusOK, filtered)
}

func AddWorkPermit(c *gin.Context) {
	var req WorkPermitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	workPermit := database.WorkPermit{
		UserID:         1,
		Date:           req.Date,
		Session:        req.Session,
		LeaveType:      req.LeaveType,
		Reason:         req.Reason,
		SupportingFile: req.SupportingFile,
		Status:         "pending",
	}

	database.DB.AddWorkPermit(workPermit)
	c.JSON(http.StatusCreated, workPermit)
}
