OSCAR MVP Technical Specification
1. Screen Architecture
-Login Screen
-Plant Dashboard Screen
-Daily Round Section Menu
-Checklist Item Entry Screen
-Lab & Process Data Entry Screen
-Suggestions Screen
-Issues / Actions Screen
-Daily Summary & Signoff Screen
-History / Records Screen
-Admin Configuration Screen
2. Navigation Flow
User Login → Plant Dashboard → Start Daily Round → Complete Sections Sequentially → Enter Labs → Suggestions Generated → Issues Entry → Summary → Sign Off → Save Record → Return to Dashboard
3. Database Tables (Conceptual)
Users Table
-user_id
-name
-email
-password_hash
-role
-active_flag
-assigned_plants
Plants Table
-plant_id
-plant_name
-location
-plant_type
-feature_flags
-threshold_settings
Daily_Rounds Table
-round_id
-plant_id
-operator_id
-date
-start_time
-end_time
-status
Checklist_Entries Table
-entry_id
-round_id
-section
-task_name
-status
-note
-timestamp
Lab_Entries Table
-lab_id
-round_id
-parameter
-value
-unit
-timestamp
Observation_Entries Table
-observation_id
-round_id
-area
-tag
-note
-timestamp
Suggestions Table
-suggestion_id
-round_id
-rule_triggered
-severity
-message
-acknowledged_flag
-timestamp
Issues Table
-issue_id
-round_id
-description
-action_taken
-supervisor_flag
-timestamp
4. Rule Engine Structure
Rules should be stored as configurable objects or JSON records. Each rule contains: rule_name, parameter_condition, optional_trend_condition, optional_observation_tag, suggestion_text, severity.
Example Rule Object
{ rule_name: 'LOW_DO', condition: DO < threshold, message: 'Dissolved oxygen appears low. Consider checking aeration.', severity: 'Caution' }
5. Performance Requirements
-Checklist item response time < 0.5 seconds
-Auto-save after each input
-Offline tolerance preferred (sync when connected)
-Tablet-first responsive design
-Minimal screen transitions
6. Admin Configuration Needs
-Enable/disable checklist sections
-Configure plant lab fields
-Configure rule thresholds
-Reorder checklist items
-Assign users to plants
7. Suggested Tech Stack (Open Recommendation)
-Frontend: React or Flutter
-Backend: Firebase / Supabase / Node API
-Database: Postgres or NoSQL
-Authentication: Managed auth provider
-Hosting: Cloud platform