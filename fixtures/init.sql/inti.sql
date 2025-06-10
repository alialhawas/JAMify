
-- Step 1: Create the database
CREATE DATABASE music_db;

-- Step 2: Connect to the database before creating schema and tables
\c music_db;

-- Step 3: Create schema (without using "music_db" prefix)
CREATE SCHEMA music;

CREATE TABLE music.songs (
    song_id TEXT NOT NULL,    
    user_id TEXT NOT NULL, 
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

    PRIMARY KEY (song_id, user_id)
);


CREATE TABLE music.artists (
    artist_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    genres TEXT[],
    popularity INTEGER CHECK (popularity >= 0 AND popularity <= 100),
    image TEXT,
    external_url TEXT,
    PRIMARY KEY (artist_id, user_id)

);
