OSCAR MVP Visual Flow Document
Operator User Flow

LOGIN
↓
SELECT PLANT
↓
START DAILY ROUND
↓
ARRIVAL / PROPERTY CHECK
↓
MECHANICAL EQUIPMENT CHECK
↓
PROCESS OBSERVATIONS (Foam / Odor / Color / Clarifier)
↓
HOUSEKEEPING / ROUTINE ITEMS
↓
LAB & OPERATING DATA ENTRY
↓
RULE ENGINE RUNS (Suggestions Generated)
↓
SUGGESTIONS REVIEW
↓
ISSUES / ACTIONS / NOTES
↓
DAILY SUMMARY & SIGN OFF
↓
SAVE DAILY RECORD
↓
HISTORY AVAILABLE

Internal System Logic Flow

User Inputs Checklist Data
↓
System Stores Checklist Entries
↓
User Inputs Observation Tags
↓
System Stores Observation Data
↓
User Inputs Lab / Process Data
↓
System Loads Plant Threshold Settings
↓
System Evaluates Rules
↓
Triggered Suggestions Created
↓
Suggestions Displayed to Operator
↓
Operator Acknowledges / Adds Notes
↓
Daily Round Closed
↓
All Records Stored for History & Review

System Architecture Overview

Tablet / Browser App
↓
API / Backend Service
↓
Rules Engine
↓
Database Storage

Admin Configuration Flow

Admin Login
↓
Select Plant
↓
Configure Checklist Items
Configure Enabled Sections
Configure Lab Fields
Configure Threshold Values
Configure Users
↓
Save Settings
↓
Settings Used in Daily Round Logic
