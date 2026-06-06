-- CreateTable
CREATE TABLE "game_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_list_items" (
    "id" UUID NOT NULL,
    "list_id" UUID NOT NULL,
    "game_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_lists_user_id_idx" ON "game_lists"("user_id");

-- CreateIndex
CREATE INDEX "game_list_items_list_id_idx" ON "game_list_items"("list_id");

-- CreateIndex
CREATE INDEX "game_list_items_game_id_idx" ON "game_list_items"("game_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_list_items_list_id_game_id_key" ON "game_list_items"("list_id", "game_id");

-- AddForeignKey
ALTER TABLE "game_lists" ADD CONSTRAINT "game_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_list_items" ADD CONSTRAINT "game_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "game_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_list_items" ADD CONSTRAINT "game_list_items_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
