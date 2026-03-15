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
-- Table structure for table `issues`
--

DROP TABLE IF EXISTS `issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issues` (
  `book_id` varchar(4) NOT NULL,
  `issue_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `fine_penalty` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  PRIMARY KEY (`book_id`,`issue_date`),
  KEY `fk_issues_students` (`student_id`),
  KEY `fk_issues_faculty` (`faculty_id`),
  CONSTRAINT `fk_issues_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_issues_students` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `issues_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `issues`
--

LOCK TABLES `issues` WRITE;
/*!40000 ALTER TABLE `issues` DISABLE KEYS */;
INSERT INTO `issues` VALUES ('B001','2025-01-10','2025-01-20','Returned',0,NULL,NULL),('B002','2025-01-12',NULL,'Issued',0,NULL,NULL),('B003','2025-01-15','2025-02-01','Returned',0,NULL,NULL),('B004','2025-01-18','2025-02-10','Overdue',50,NULL,NULL),('B005','2025-01-20',NULL,'Issued',0,NULL,NULL),('B006','2025-01-22','2025-02-05','Returned',0,NULL,NULL),('B007','2025-01-25','2025-02-20','Overdue',30,NULL,NULL),('B008','2025-01-28',NULL,'Issued',0,NULL,NULL),('B009','2025-02-01','2025-02-14','Returned',0,NULL,NULL),('B010','2025-02-03','2025-03-01','Overdue',40,NULL,NULL),('B011','2025-02-05',NULL,'Issued',0,NULL,NULL),('B012','2025-02-08','2025-02-25','Returned',0,NULL,NULL),('B013','2025-02-10','2025-03-05','Overdue',60,NULL,NULL),('B014','2025-02-12',NULL,'Issued',0,NULL,NULL),('B015','2025-02-15','2025-02-28','Returned',0,NULL,NULL),('B016','2025-02-18',NULL,'Issued',0,NULL,NULL),('B017','2025-02-20','2025-03-10','Returned',0,NULL,NULL),('B018','2025-02-22','2025-03-20','Overdue',25,NULL,NULL),('B019','2025-02-25',NULL,'Issued',0,NULL,NULL),('B020','2025-02-28','2025-03-15','Returned',0,NULL,NULL);
/*!40000 ALTER TABLE `issues` ENABLE KEYS */;
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
