export type ProfileDetails = {
  id: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type StoreSettings = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
  role: string | null;
  canEdit: boolean;
};

export type StoreNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};
