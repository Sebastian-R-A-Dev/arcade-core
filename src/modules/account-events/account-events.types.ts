export type AccountEventListItemDto = {
  id: number;
  type: string;
  status: string;
  target_user_id: number;
  target_email: string;
  target_app_name: string;
  initiated_by_id: number | null;
  initiated_by_email: string | null;
  created_at: string;
  completed_at: string | null;
};

export type PendingPasswordChangeDto = {
  event_id: number;
  type: 'password_reset_required';
};
