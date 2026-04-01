-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "parking_note" TEXT,
    "handoff_note" TEXT,
    "meeting_note" TEXT,
    "difficulty_note" TEXT
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "team_id" TEXT NOT NULL,
    "note" TEXT,
    "uniform_number" TEXT,
    "nearest_station" TEXT,
    "has_car" BOOLEAN NOT NULL DEFAULT false,
    "has_black_pants" BOOLEAN NOT NULL DEFAULT false,
    "has_black_socks" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Member_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_at" TEXT,
    "end_at" TEXT,
    "venue_id" TEXT NOT NULL,
    "primary_team_id" TEXT NOT NULL,
    "is_joint_match" BOOLEAN NOT NULL DEFAULT false,
    "referee_time" TEXT,
    "main_referee_id" TEXT,
    "sub_referee_id" TEXT,
    "note" TEXT,
    CONSTRAINT "Event_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_primary_team_id_fkey" FOREIGN KEY ("primary_team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "size" TEXT,
    "color" TEXT,
    "owner_team_id" TEXT NOT NULL,
    "shared_flag" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "current_holder_id" TEXT,
    "current_holder_type" TEXT,
    "status_note" TEXT,
    "note" TEXT,
    CONSTRAINT "Item_owner_team_id_fkey" FOREIGN KEY ("owner_team_id") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventRequiredItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "required_flag" BOOLEAN NOT NULL DEFAULT true,
    "assigned_member_id" TEXT,
    "assignment_status" TEXT NOT NULL DEFAULT 'unassigned',
    "is_personal_item" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    CONSTRAINT "EventRequiredItem_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventRequiredItem_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventRequiredItem_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "attendance_status" TEXT NOT NULL DEFAULT 'pending',
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventParticipant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventParticipant_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Handoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "from_member_id" TEXT NOT NULL,
    "to_member_id" TEXT NOT NULL,
    "source_event_id" TEXT,
    "target_event_id" TEXT,
    "venue_id" TEXT,
    "handoff_start_at" DATETIME,
    "handoff_end_at" DATETIME,
    "receive_deadline_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    CONSTRAINT "Handoff_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Handoff_from_member_id_fkey" FOREIGN KEY ("from_member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Handoff_to_member_id_fkey" FOREIGN KEY ("to_member_id") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_item_code_key" ON "Item"("item_code");
