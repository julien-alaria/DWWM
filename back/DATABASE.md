# DATABASE

 CREATE DATABASE IF NOT EXISTS trader_tracker;
 USE trader_tracker;

 CREATE TABLE assets_types (
 id INT AUTO_INCREMENT PRIMARY KEY,
 asset_type VARCHAR(255) NOT NULL UNIQUE
 );

 CREATE TABLE assets (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 ticker VARCHAR(20) UNIQUE NOT NULL,
 asset_type_id INT NOT NULL,

 FOREIGN KEY (asset_type_id)
 REFERENCES assets_types(id)
 ON DELETE RESTRICT
 );

 CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(255) NOT NULL,
 email VARCHAR(255) NOT NULL UNIQUE,
 password VARCHAR(255) NOT NULL,
 role ENUM('admin', 'user', 'analyst') DEFAULT 'user',
 company VARCHAR(255),
 bio TEXT,
 analyst_verified BOOLEAN DEFAULT FALSE,
 analyst_type_id INT,
 picture VARCHAR(255),
 document VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

 FOREIGN KEY (analyst_type_id)
 REFERENCES assets_types(id)
 ON DELETE SET NULL
 );

 CREATE TABLE users_assets_follow (
 id INT AUTO_INCREMENT PRIMARY KEY,
 asset_id INT NOT NULL,
 user_id INT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(asset_id, user_id),

 FOREIGN KEY (asset_id)
 REFERENCES assets(id)
 ON DELETE CASCADE,

 FOREIGN KEY (user_id)
 REFERENCES users(id)
 ON DELETE CASCADE
 );

 CREATE TABLE recommendations (
 id INT AUTO_INCREMENT PRIMARY KEY,
 status ENUM('BUY', 'SELL', 'HOLD') NOT NULL,
 comment TEXT,
 asset_id INT NOT NULL,
 user_id INT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

 FOREIGN KEY (asset_id)
 REFERENCES assets(id)
 ON DELETE CASCADE,

 FOREIGN KEY (user_id)
 REFERENCES users(id)
 ON DELETE CASCADE
 );

 CREATE TABLE user_follows (
 id INT AUTO_INCREMENT PRIMARY KEY,
 follower_id INT NOT NULL,
 followed_id INT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY unique_follow (follower_id, followed_id),
 FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
 );
