export interface Book {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  file_url: string;
  total_pages: number;
  current_page: number;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  title?: string;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  book_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  page_context?: number;
  selected_text?: string;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  text: string;
  color: string;
  created_at: string;
}
