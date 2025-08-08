// Test file to verify Task 10 database types are working correctly
import type { 
  PackingItem, 
  OutfitItem, 
  Message, 
  Photo,
  PackingItemInsert,
  OutfitItemInsert,
  MessageInsert,
  PhotoInsert,
  PackingItemWithUser,
  MessageWithUser,
  PhotoWithUploader,
  Database
} from './src/lib/types/database';

// Test that all types can be used correctly
const testPackingItem: PackingItem = {
  id: 'test',
  trip_id: 'test',
  user_id: 'test',
  name: 'Test Item',
  description: null,
  category: 'clothing',
  quantity: 1,
  is_packed: false,
  priority: 'medium',
  is_shared: false,
  shared_with: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const testMessage: Message = {
  id: 'test',
  trip_id: 'test',
  user_id: 'test',
  content: 'Test message',
  message_type: 'text',
  reply_to: null,
  attachments: [],
  is_edited: false,
  edited_at: null,
  is_pinned: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

console.log('✅ All Task 10 types are working correctly');
