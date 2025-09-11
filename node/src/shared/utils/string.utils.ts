export const AUTH_STRING = {
  SUCCESS: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    PASSWORD_CHANGED: 'Password changed successfully',
    PASSWORD_RESET: 'Password reset successful',
    PASSWORD_RESET_REQUEST: 'Password reset request successful',
    TWO_FACTOR_AUTH_CODE_SENT: 'Two factor authentication code sent',
    TWO_FACTOR_AUTH_ENABLED: 'Two factor authentication enabled',
    TWO_FACTOR_AUTH_DISABLED: 'Two factor authentication disabled',

    FORGOT_PASSWORD_SUCCESS: 'Forgot password request successful',
  },
  ERROR: {
    INVALID_EMAIL_PASSWORD: 'Invalid email or password',
    LOGIN_VERIFICATION_REMAIN: 'Login verification remain',
    TWO_FA_CODE_REQUIRED: 'Two factor authentication code required',
    INVALID_TWO_FA_CODE: 'Invalid two factor authentication code',
    UNAUTHORIZED: 'Unauthorized',
    NOT_AUTHENTICATED: 'Not authenticated',
    USER_NOT_FOUND: 'User not found',
    EMAIL_NOT_SENT: 'Email not sent due to some internal error',
    TOKEN_EXPIRED: 'Token is invalid or expired',
    INVALID_OLD_PASSWORD: 'Invalid old password',
  },
};

export const USERS_STRING = {
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    USER_FETCHED: 'User information fetched successfully',
    USER_UPDATED: 'User updated successfully',
    // Removed BULK_ASSIGN_SUCCESS - functionality no longer supported
    PRIMARY_MANAGER_CALENDLY_FETCHED:
      'Primary manager Calendly URL retrieved successfully',
  },
  ERROR: {
    USER_NOT_FOUND: 'User not found',
    USER_EXIST: 'User with this email already exists',
    // Removed agency-related error messages
    PROFILE_IMAGE_REQUIRED: 'Profile image is required',
    // Removed bulk assignment error messages for single-user application
    PRIMARY_MANAGER_NOT_FOUND: 'Primary manager not found',
  },
};



export const DESIGNATION_STRING = {
  SUCCESS: {
    DESIGNATION_CREATED: 'Designation created successfully',
    DESIGNATIONS_FETCHED: 'Designations fetched successfully',
    DESIGNATION_FETCHED: 'Designation fetched successfully',
    DESIGNATION_UPDATED: 'Designation updated successfully',
    DESIGNATION_DELETED: 'Designation deleted successfully',
  },
  ERROR: {
    DESIGNATION_NOT_FOUND: 'Designation not found',
    DESIGNATION_ALREADY_EXISTS: 'Designation with this name already exists',
  },
};

export const GUIDELINES_STRING = {
  SUCCESS: {
    GUIDELINES_CREATED: 'Guideline created successfully',
    GUIDELINES_FETCHED: 'Guidelines fetched successfully',
    GUIDELINE_FETCHED: 'Guideline fetched successfully',
    GUIDELINES_UPDATED: 'Guideline updated successfully',
    GUIDELINES_DELETED: 'Guideline deleted successfully',
  },
  ERROR: {
    GUIDELINES_NOT_FOUND: 'Guideline not found',
    GUIDELINES_ALREADY_EXISTS: 'Guideline with this name already exists',
  },
};

export const SYSTEM_PROMPT_STRING = {
  SUCCESS: {
    SYSTEM_PROMPT_CREATED: 'System prompt created successfully',
    SYSTEM_PROMPTS_FETCHED: 'System prompts fetched successfully',
    SYSTEM_PROMPT_FETCHED: 'System prompt fetched successfully',
    SYSTEM_PROMPT_UPDATED: 'System prompt updated successfully',
    SYSTEM_PROMPT_DELETED: 'System prompt deleted successfully',
  },
  ERROR: {
    SYSTEM_PROMPT_NOT_FOUND: 'System prompt not found',
    SYSTEM_PROMPT_ALREADY_EXISTS: 'System prompt with this name already exists',
    SYSTEM_PROMPT_DEFAULT_NO_DELETE:
      'Default system prompt could not be delete',
  },
};

export const PROMPT_TYPES_STRING = {
  SUCCESS: {
    PROMPT_TYPE_CREATED: 'Prompt type created successfully',
    PROMPT_TYPES_FETCHED: 'Prompt types fetched successfully',
    PROMPT_TYPE_FETCHED: 'Prompt type fetched successfully',
    PROMPT_TYPE_UPDATED: 'Prompt type updated successfully',
    PROMPT_TYPE_DELETED: 'Prompt type deleted successfully',
  },
  ERROR: {
    PROMPT_TYPE_NOT_FOUND: 'Prompt type not found',
    PROMPT_TYPE_ALREADY_EXISTS: 'Prompt type with this name already exists',
  },
};

export const ACTIVITY_EVENTS_STRING = {
  SUCCESS: {
    ACTIVITY_EVENTS_FETCHED: 'Activity events fetched successfully',
  },
  ERROR: {
    ACTIVITY_EVENTS_NOT_FOUND: 'Activity events not found',
  },
};

export const COMMON_ERROR_STRING = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  INVALID_SORT_PARAMETER:
    'Invalid sort parameter. Format should be field:direction and direction is asc or desc',
  SOMETHING_WENT_WRONG: 'Something went wrong',
};

export const PROJECTS_STRING = {
  SUCCESS: {
    PROJECT_CREATED: 'Project created successfully',
    PROJECT_FETCHED: 'Projects fetched successfully',
    PROJECT_UPDATED: 'Project updated successfully',
    PROJECT_REMOVED: 'Project deleted successfully',
    KEYWORD_METRICS_FETCHED: 'Keyword metrics fetched successfully',
    KEYWORD_RECOMMENDATION_FETCHED:
      'Keyword recommendation fetched successfully',
    // Removed project member-related messages
    // Removed PROJECT_BULK_ASSIGNED - functionality no longer supported
    PROJECT_SITEMAP_FETCH: 'Project sitemap fetched successfully',
    PROJECT_DELETED: 'Project deleted successfully',
    BUSINESS_DESCRIPTION_GENERATED:
      'Business description generated successfully',
    RECOMMENDED_KEYWORD_FETCHED: 'Recommended keyword fetched successfully',
  },
  ERROR: {
    PROJECT_NOT_FOUND: 'Project not found',
    PROJECT_WEBSITE_URL_NOT_FOUND: "Project's website url not found",
    AUDIT_REPORT_FOUND: 'Not single audit report found for this project',
    PROJECT_IDS_NOT_ARRAY: 'Project ids is not an array',
    INVALID_USER_ID: 'Invalid user ids provided',
    SITEMAP_DATA_NOT_FOUND: 'Sitemap data not found',
    NOT_KEYWORD_TO_UPDATE: 'Please provide keywords to update',
    NO_NEW_KEYWORD_FOUND: 'No any keyword found to update in project',
    USER_NOT_FOUND: 'User not found',
    DELETE_NOT_ALLOWED: 'You are not allowed to delete this project',
    UPDATE_NOT_ALLOWED: 'You are not allowed to update this project',
    FAILED_TO_FETCH_BUSINESS_DESCRIPTION:
      'Failed to fetch business description due to internal server error',
  },
};

export const OPENAI_STRING = {
  SUCCESS: {
    ARTICLE_SNIPPET_UPDATED: 'Article updated successfully',
    CHAT_RESPONSE: 'Chat completion successfully',
  },
  ERROR: {
    INVALID_REQUEST: 'Client site URL and at least one keyword are required.',
  },
};

export const DATAFORSEO_STRING = {
  ERROR: {
    INVALID_REQUEST: 'Keywords input is empty or not an array.',
    FETCH_KEYWORD_METRICS_ERROR: 'Error fetching keyword metrics',
    FETCH_KEYWORD_RECOMMENDATION_ERROR: 'Error fetching keyword recommendation',
  },
};

export const GLOBAL_STRING = {
  SUCCESS: {
    TIMEZONES_FETCHED: 'Timezones fetched successfully',
  },
};

export const ARTICLES_STRING = {
  SUCCESS: {
    ARTICLES_FETCHED: 'Articles fetched successfully',
    ARTICLES_CONTENT_FETCHED: 'Articles content fetched successfully',
    ARTICLE_AI_REQUESTED: 'Article generation requested successfully',
    ARTICLE_FETCHED: 'Article retrieved successfully',
    ARTICLE_UPDATED: 'Article updated sucessfully',
    ARTICLE_DELETED: 'Article deleted successfully',
    TOPIC_ADDED: 'Article added successfully',
    ARTICLE_STATUS_FETCHED: 'Article status fetched',
    TASK_STATUS_RETRIVED: 'Task status count retrieved successfully',
    ARTICLE_CONTENT_SELECTION_SUCCESS:
      'Selected generated article is updated in Google Docs',
    ARTICLE_DOCUMENT_GET: 'Article document get successfully',
    ARTICLE_DOCUMENT_UPDATED: 'Article has been updated successfully',
    ARTICLE_DOCUMENT_VERSIONS_GET: 'Article documents versions fetched.',
    ARTICLE_OUTLINE_GENERATED:
      'Outline has been successfully generate for this outline',
    TOPIC_GENERATED: 'Topic generated successfully',
    PROJECT_KEYWORD_FETCHED: 'Project keywords fetched successfully',
    // Removed BULK_ASSIGN_SUCCESS - functionality no longer supported
    TASK_PRIORITY_UPDATED: 'Task priority updated successfully',
    // Removed MEMBERS_ASSIGNED message
    ARTICLE_AUDIT_REPORT_FETCHED: 'Article audit report fetched successfully',
    RECOMMENDED_KEYWORD_FETCHED: 'Recommended keyword fetched for this article',
  },
  ERRORS: {
    ARTICLE_NOT_FOUND: 'Article not found with this id',
    ARTICLE_DOCUMENT_NOT_FOUND: 'Document not found on this article',
    UNABLE_TO_GENERATE_ARTICLE:
      'Unable to generate article due to internal error',
    GENERATED_ARTICLE_NOT_FOUND: 'Generate article not found for this article',
    ARTICLE_DOCUMENT_SESSION_ID_MISMATCH: 'Document Session id mismatch',
    // Removed AGENCY_NOT_FOUND message
    INVALID_ARTICLES_IDS: 'Invalid articles ids provided',
    ARTICLE_DOCUMENT_INVALID_SNAPSHOT: 'Invalid snapshot data',
    ARTICLE_TYPE_NOT_FOUND: 'Please provide article type',
    ERROR_GENERATING_TITLES:
      'Error generating titles for this article. Please try again',
    ERROR_FETCHING_KEYWORD_METRICS: 'Error fetching keyword metrics',
    ACCESS_DENIED: 'You do not have access to this article',
    ARTICLE_AUDIT_REPORT_NOT_PRESENT: 'Article audit report is not fetched',
    FAILED_ARTICLE_GENERATION_FROM_SERVER:
      'Failed to generated article due to internal server error',
  },
};

// EMAIL_STRING removed - email functionality not supported in single-user application

export const GOOGLE_DOC_SERVICE_STRING = {
  ERRORS: {
    DOC_URL_REQUIRED: 'Google Doc URL is required',
    INVALID_DOC_URL: 'Invalid Google Doc URL format',
  },
};

export const WEBHOOK_STRING = {
  ARTICLE_UPDATE_REQUESTED:
    'Article content webhook request successfully accepted',
};

export const DASHBOARD_STRING = {
  SUCCESS: {
    CONTENT_STATS_FETCHED: 'Content selection statistics fetched successfully',
    DETAILED_CONTENT_STATS_FETCHED:
      'Detailed content statistics fetched successfully',
    DASHBOARD_OVERVIEW_FETCHED: 'Dashboard overview fetched successfully',
    CONTENT_METRICS_RETRIEVED: 'Content metrics retrieved successfully',
    ANALYTICS_DATA_FETCHED: 'Analytics data fetched successfully',
    DASHBOARD_DATA_UPDATED: 'Dashboard data updated successfully',
    ARTICLE_TEXT_DIFF_FETCHED: 'Article text differences fetched successfully',
    USER_STATISTICS_FETCHED: 'User statistics fetched successfully',
  },
  ERROR: {
    STATS_NOT_FOUND: 'Statistics not found',
    INVALID_DATE_RANGE: 'Invalid date range provided',
    INSUFFICIENT_DATA: 'Insufficient data available for the selected filters',
    ANALYTICS_ERROR: 'Error retrieving analytics data',
    DASHBOARD_ACCESS_DENIED: 'Access denied to dashboard data',
    INVALID_FILTER_PARAMETERS: 'Invalid filter parameters provided',
    CONTENT_STATS_ERROR: 'Error fetching content selection statistics',
    METRICS_CALCULATION_ERROR: 'Error calculating dashboard metrics',
  },
};



// TIME_TRACKING_STRING removed for single-user application
