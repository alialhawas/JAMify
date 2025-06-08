
-- Step 1: Create the database
CREATE DATABASE music_db;

-- Step 2: Connect to the database before creating schema and tables
\c music_db;

-- Step 3: Create schema (without using "music_db" prefix)
CREATE SCHEMA music;

-- Step 4: Create the table inside the schema
CREATE TABLE music.songs (
    song_id TEXT NOT NULL,    
    user_id TEXT NOT NULL,  -- Changed "user" to "user_id" (as "user" is a reserved keyword)
    song_name VARCHAR(255) NOT NULL, 
    artist_id TEXT NOT NULL,        
    artist_name VARCHAR(255) NOT NULL, 
    release_date DATE,           
    image1 TEXT,                   
    image2 TEXT,                 
    image3 TEXT,                   
    external_url TEXT,            
    popularity INTEGER CHECK (popularity >= 0 AND popularity <= 100), 
    preview_url TEXT,

    -- Composite Primary Key (ensures song_id + user_id are unique together)
    PRIMARY KEY (song_id, user_id)
);
