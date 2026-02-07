package handlers

import (
	"net/http"
	"time"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
)

type AssignmentRequest struct {
	ObjectiveID uint   `json:"objective_id" binding:"required"`
	Submission  string `json:"submission" binding:"required"`
}

func GetObjectives(c *gin.Context) {
	var active []database.Objective
	for _, obj := range database.DB.Objectives {
		if obj.IsActive {
			active = append(active, obj)
		}
	}
	c.JSON(http.StatusOK, active)
}

func GetAssignments(c *gin.Context) {
	c.JSON(http.StatusOK, database.DB.Assignments)
}

func SubmitAssignment(c *gin.Context) {
	var req AssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	assignment := database.Assignment{
		UserID:      1,
		ObjectiveID: req.ObjectiveID,
		Submission:  req.Submission,
		SubmittedAt: time.Now().Format("2006-01-02 15:04:05"),
	}

	database.DB.AddAssignment(assignment)
	c.JSON(http.StatusCreated, assignment)
}
