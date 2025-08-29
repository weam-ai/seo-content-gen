export const iEventType = {
  // User events
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_SIGNED_UP: 'user.signed_up',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_PASSWORD_UPDATED: 'user.password_updated',
  USER_ENABLED: 'user.enabled',
  USER_DISABLED: 'user.disabled',
  USER_2FA_ENABLED: 'user.2fa_enabled',
  USER_2FA_DISABLED: 'user.2fa_disabled',
  USER_NAME_UPDATED: 'user.name_updated',
  USER_EMAIL_UPDATED: 'user.email_updated',

  // Auto login events
  AUTO_LOGIN: 'auto.login',



  // Designation events
  DESIGNATION_CREATED: 'designation.created',
  DESIGNATION_UPDATED: 'designation.updated',
  DESIGNATION_DELETED: 'designation.deleted',

  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',

  // Topic events
  TOPIC_CREATED: 'topic.created',
  TOPIC_UPDATED: 'topic.updated',
  TOPIC_DELETED: 'topic.deleted',

  // Articles events
  ARTICLE_CREATED: 'article.created',
  ARTICLE_UPDATED: 'article.updated',
  ARTICLE_DELETED: 'article.deleted',
} as const;

export type iEventTypeValue = (typeof iEventType)[keyof typeof iEventType];
