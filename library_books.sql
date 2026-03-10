-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: library
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `book_id` varchar(4) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `total_copies` int DEFAULT NULL,
  `available_copies` int DEFAULT NULL,
  PRIMARY KEY (`book_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
INSERT INTO `books` VALUES ('B001','The Adventures of Chronicles','Jordan Brown','Programming',10,7),('B002','The Dream of Shadows','Taylor Walker','History',8,5),('B003','The Shadows of Mystery','Jordan Johnson','Science',12,8),('B004','The Chronicles of Dream','Casey Walker','Fiction',7,4),('B005','The Future of Adventures','Skyler Lee','Programming',9,6),('B006','The Chronicles of Chronicles','Skyler Smith','Thriller',10,9),('B007','The Journey of Adventures','Morgan Hall','Fiction',11,7),('B008','The Legacy of Quest','Alex Clark','Science',8,6),('B009','The Mystery of Dream','Jordan Anderson','Fiction',12,10),('B010','The Adventures of Shadows','Dakota Taylor','Programming',10,8),('B011','The Shadows of Adventures','Riley Clark','Fiction',9,6),('B012','The Future of Dream','Riley Hall','Fiction',10,7),('B013','The Code of Shadows','Quinn Walker','Thriller',8,5),('B014','The Code of Journey','Skyler Walker','Thriller',11,9),('B015','The Mystery of Shadows','Morgan Clark','Science',9,7),('B016','The Future of Shadows','Skyler Hall','Programming',10,8),('B017','The Chronicles of Legacy','Taylor Clark','Thriller',7,5),('B018','The Mystery of Legacy','Casey Smith','Fiction',12,11),('B019','The Future of Mystery','Casey Hall','Fiction',10,8),('B020','The Quest of Chronicles','Jordan Smith','Programming',9,7),('B021','The Journey of Chronicles','Jordan Allen','Science',11,9),('B022','The Dream of Quest','Jamie Johnson','Science',10,8),('B023','The Adventures of Journey','Skyler Anderson','History',12,10),('B024','The Chronicles of Journey','Jamie Allen','Fiction',9,7),('B025','The Adventures of Dream','Casey Clark','Science',11,9),('B026','The Quest of Adventures','Skyler Smith','Science',10,8),('B027','The Adventures of Legacy','Morgan Brown','Science',8,6),('B028','The Chronicles of Mystery','Taylor Taylor','Thriller',12,10),('B029','The Future of Journey','Dakota Clark','Programming',10,7),('B030','The Future of Code','Morgan Johnson','History',9,8),('B031','The Dream of Journey','Jordan Smith','Programming',11,9),('B032','The Shadows of Shadows','Riley Lee','History',10,8),('B033','The Quest of Future','Jordan Lee','Fiction',12,10),('B034','The Dream of Chronicles','Casey Taylor','Programming',8,6),('B035','The Future of Legacy','Casey Smith','Programming',9,7),('B036','The Shadows of Legacy','Skyler Taylor','Fiction',11,9),('B037','The Quest of Quest','Casey Taylor','Programming',10,8),('B038','The Chronicles of Shadows','Dakota Brown','Fiction',12,10),('B039','The Shadows of Quest','Morgan Taylor','Science',9,7),('B040','The Journey of Journey','Casey Hall','History',11,9),('B041','The Mystery of Mystery','Riley Lee','History',10,7),('B042','The Quest of Shadows','Jordan Hall','History',12,10),('B043','The Quest of Code','Morgan Smith','Programming',9,7),('B044','The Legacy of Adventures','Jamie Johnson','History',11,9),('B045','The Legacy of Dream','Alex Johnson','Thriller',10,8),('B046','The Journey of Legacy','Quinn Anderson','Science',12,10),('B047','The Legacy of Future','Morgan Clark','Fiction',8,6),('B048','The Dream of Mystery','Riley Walker','Thriller',10,8),('B049','The Adventures of Quest','Skyler Walker','Programming',9,7),('B050','The Mystery of Quest','Skyler Anderson','Fiction',12,10),('B051','The Shadows of Chronicles','Alex Walker','Fiction',11,9),('B052','The Dream of Dream','Skyler Allen','Thriller',10,8),('B053','The Adventures of Mystery','Alex Smith','Thriller',12,10),('B054','The Shadows of Dream','Alex Hall','Thriller',9,7),('B055','The Legacy of Legacy','Alex Allen','History',10,8),('B056','The Future of Future','Jamie Smith','Thriller',11,9),('B057','The Chronicles of Future','Jordan Allen','Thriller',12,10),('B058','The Code of Mystery','Casey Johnson','Thriller',9,7),('B059','The Code of Code','Alex Taylor','Thriller',10,8),('B060','The Code of Chronicles','Alex Hall','Fiction',12,10),('B061','The Code of Quest','Skyler Allen','Science',11,9),('B062','The Journey of Code','Jordan Lee','Fiction',10,8),('B063','The Mystery of Journey','Alex Brown','Thriller',12,10),('B064','The Journey of Quest','Casey Smith','Thriller',11,9),('B065','The Journey of Shadows','Taylor Lee','Science',10,8),('B066','The Code of Adventures','Taylor Taylor','Science',12,10),('B067','The Legacy of Code','Jamie Clark','Programming',11,9),('B068','The Shadows of Journey','Riley Anderson','Science',10,8),('B069','The Future of Quest','Dakota Walker','History',12,10),('B070','The Chronicles of Quest','Casey Smith','Programming',11,9),('B071','The Shadows of Future','Alex Anderson','Thriller',10,8),('B072','The Journey of Mystery','Casey Taylor','Thriller',12,10),('B073','The Mystery of Adventures','Alex Smith','Thriller',11,9),('B074','The Code of Dream','Dakota Johnson','Programming',10,8),('B075','The Journey of Dream','Dakota Clark','Thriller',12,10),('B076','The Legacy of Mystery','Taylor Brown','Programming',11,9),('B077','The Legacy of Journey','Taylor Johnson','Programming',10,8),('B078','The Dream of Legacy','Casey Walker','Science',12,10),('B079','The Code of Legacy','Taylor Allen','History',11,9),('B080','The Future of Chronicles','Jordan Anderson','Science',10,8),('B081','The Quest of Mystery','Taylor Smith','History',12,10),('B082','The Chronicles of Adventures','Jordan Anderson','History',11,9),('B083','The Code of Future','Jamie Lee','Science',10,8),('B084','The Adventures of Adventures','Taylor Brown','History',12,10),('B085','The Adventures of Future','Quinn Lee','History',11,9),('B086','The Dream of Adventures','Dakota Anderson','Fiction',10,8),('B087','The Quest of Journey','Taylor Allen','History',12,10),('B088','The Dream of Code','Taylor Anderson','Thriller',11,9),('B089','The Legacy of Chronicles','Jordan Lee','Thriller',10,8),('B090','The Adventures of Code','Quinn Hall','Fiction',12,10),('B091','TWENTY THOUSAND LEAGUES UNDER THE SEA','Jules Verne','Fiction',10,9);
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-24 19:36:07
