-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: edulms_project
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `due_date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `teacher_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (1,1,'Copia id chirographum aequitas acerbitas virgo corporis.','Veniam vomito auxilium adimpleo adicio incidunt aspernatur. Omnis assumenda animus vilicus denique suppellex colo caute carus. Turpis degusto adfero totus.','2025-09-27 14:44:58','2025-09-26 12:59:44',1),(2,2,'Verumtamen vos vulpes vulgo aufero quo sophismata.','Casus tredecim truculenter atrox auxilium acquiro amo aperio cado. Vae sollers deporto stillicidium cogo unus statim sunt cunctatio summopere. Abstergo neque caecus.','2025-09-27 10:03:34','2025-09-26 12:59:44',2),(3,3,'Aedificium tantillus corporis.','Fugiat quidem alienus pecco nulla sunt utpote unus nisi. Caput cognomen nisi occaecati. Aqua adulescens vomito copiose confido in valde vis ancilla.','2025-09-26 22:37:19','2025-09-26 12:59:44',3),(4,4,'Iusto statua tergiversatio cognatus crudelis vociferor theca doloribus cribro angustus.','Deficio conatus patior est vel. Thesis tandem demum facere. Ustulo absconditus cerno calamitas sumo cibo consequuntur.','2025-09-26 18:40:43','2025-09-26 12:59:44',4),(5,5,'Speciosus tubineus vos somniculosus deludo accommodo ullam casso adipisci.','Depulso aufero arceo patior suppellex vitium voco antepono maxime texo. Toties consuasor cometes utroque textus. Ipsam vergo absconditus versus somniculosus admiratio acervus aiunt alveus depromo.','2025-09-26 20:08:27','2025-09-26 12:59:44',5);
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `details` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `meta` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,NULL,'failed_login',NULL,'2025-09-26 13:08:13',NULL,NULL,'{\"ip\": \"::1\", \"email\": \"admin@example.com\", \"reason\": \"invalid_password\"}'),(2,16,'login',NULL,'2025-09-26 13:08:25',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(3,16,'login',NULL,'2025-09-26 13:11:03',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(4,16,'login',NULL,'2025-09-26 13:32:51',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(5,16,'login',NULL,'2025-09-26 13:35:02',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(6,16,'login',NULL,'2025-09-26 13:38:03',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(7,16,'login',NULL,'2025-09-26 14:01:05',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(8,16,'login',NULL,'2025-09-26 14:04:52',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(9,16,'login',NULL,'2025-09-26 14:09:18',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(10,16,'login',NULL,'2025-09-26 14:14:02',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(11,16,'login',NULL,'2025-09-26 14:22:56',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(12,16,'logout',NULL,'2025-09-26 14:23:03',NULL,NULL,'{\"ip\": \"::1\"}'),(13,16,'login',NULL,'2025-09-26 14:34:52',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(14,16,'login',NULL,'2025-09-26 14:50:48',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(15,16,'login',NULL,'2025-09-26 15:46:48',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(16,16,'logout',NULL,'2025-09-26 15:46:52',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\"}'),(17,18,'login',NULL,'2025-09-26 16:38:42',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(18,19,'register',NULL,'2025-09-26 16:39:24',NULL,NULL,'{\"ip\": \"::1\"}'),(19,18,'login',NULL,'2025-09-27 05:09:25',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(20,NULL,'failed_login',NULL,'2025-09-27 05:16:30',NULL,NULL,'{\"ip\": \"::1\", \"email\": \"teacher@1.com\", \"reason\": \"user_not_found\"}'),(21,18,'login',NULL,'2025-09-27 05:16:37',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(22,18,'login',NULL,'2025-09-27 05:28:26',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(23,18,'login',NULL,'2025-09-27 05:33:35',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(24,18,'login',NULL,'2025-09-27 05:39:45',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(25,18,'login',NULL,'2025-09-28 02:39:52',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(26,16,'login',NULL,'2025-09-28 06:00:58',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(27,16,'login',NULL,'2025-09-28 06:01:08',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(28,16,'logout',NULL,'2025-09-28 06:19:08',NULL,NULL,'{\"ip\": \"::1\"}'),(29,16,'login',NULL,'2025-09-28 06:19:11',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(30,16,'login',NULL,'2025-09-28 06:21:04',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(31,16,'logout',NULL,'2025-09-28 06:23:19',NULL,NULL,'{\"ip\": \"::1\"}'),(32,16,'login',NULL,'2025-09-28 06:23:24',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(33,16,'login',NULL,'2025-09-28 06:26:13',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(34,16,'logout',NULL,'2025-09-28 06:43:47',NULL,NULL,'{\"ip\": \"::1\"}'),(35,NULL,'failed_login',NULL,'2025-09-29 06:53:07',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"email\": \"admin@example.com\", \"reason\": \"invalid_password\"}'),(36,NULL,'failed_login',NULL,'2025-09-29 06:53:14',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"email\": \"admin@example.com\", \"reason\": \"invalid_password\"}'),(37,NULL,'failed_login',NULL,'2025-09-29 06:53:19',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"email\": \"senior@example.com\", \"reason\": \"user_not_found\"}'),(38,NULL,'failed_login',NULL,'2025-09-29 06:53:39',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"email\": \"admin@example.com\", \"reason\": \"invalid_password\"}'),(39,NULL,'failed_login',NULL,'2025-09-29 06:54:21',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"email\": \"admin@example.com\", \"reason\": \"invalid_password\"}'),(40,16,'login',NULL,'2025-09-29 06:54:56',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(41,16,'login',NULL,'2025-09-29 07:11:22',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(42,16,'login',NULL,'2025-09-29 07:37:17',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(43,16,'login',NULL,'2025-09-29 07:53:23',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(44,16,'login',NULL,'2025-09-29 07:53:34',NULL,NULL,'{\"ip\": \"::ffff:127.0.0.1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(45,16,'logout',NULL,'2025-09-29 07:53:45',NULL,NULL,'{\"ip\": \"::1\"}'),(46,18,'login',NULL,'2025-09-29 07:53:49',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(47,18,'login',NULL,'2025-09-29 08:09:44',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(48,18,'login',NULL,'2025-09-29 09:03:00',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(49,18,'login',NULL,'2025-09-29 09:03:01',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}'),(50,18,'login',NULL,'2025-09-29 09:23:25',NULL,NULL,'{\"ip\": \"::1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36\"}');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `teacher_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'Ondricka - Runolfsdottir','Custodia accusamus alius. Adficio valetudo adflicto coadunatio capitulus ullam arbustum. Modi expedita ago centum facere temporibus stipes umbra amita.',1,'2025-09-26 12:59:44'),(2,'Runolfsdottir, Rolfson and Hodkiewicz','Theca veritatis subseco. Quaerat socius tumultus distinctio tactus aestus cursim denego. Vero solitudo aqua adulatio decipio vulnus usus adfero.',2,'2025-09-26 12:59:44'),(3,'Nolan, Tremblay and Schiller','Ex comptus statim cresco ante supplanto cohors adsum curiositas. Volup volo toties acceptus odio aggero thesaurus pauper dens. Sponte tantillus absque curis adversus.',3,'2025-09-26 12:59:44'),(4,'Toy, Gleason and Nolan','Delinquo teneo textus crinis stella adipiscor facere civis caritas. Condico currus sunt officia eligendi trado. Coruscus arma turbo totus ipsum.',4,'2025-09-26 12:59:44'),(5,'Abbott Group','Vicinus conqueror sollers theologus voluptatibus basium amicitia pauper. Tero tenax absens urbs aegrus. Possimus cavus vinum.',5,'2025-09-26 12:59:44');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `course_id` int NOT NULL,
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `course` varchar(255) NOT NULL,
  `grade` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,1,'Mathematics','A','2025-09-27 05:33:12','2025-09-27 05:33:12'),(2,1,'Physics','B+','2025-09-27 05:33:12','2025-09-27 05:33:12'),(3,2,'Chemistry','A-','2025-09-27 05:33:12','2025-09-27 05:33:12'),(4,2,'Biology','B','2025-09-27 05:33:12','2025-09-27 05:33:12'),(5,1,'Mathematics','A','2025-09-27 05:39:09','2025-09-27 05:39:09'),(6,1,'English','B+','2025-09-27 05:39:09','2025-09-27 05:39:09'),(7,2,'Science','A-','2025-09-27 05:39:09','2025-09-27 05:39:09');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin','2025-09-26 12:59:44'),(2,'Teacher','2025-09-26 12:59:44'),(3,'Student','2025-09-26 12:59:44');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `admission_no` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (1,6,'ADM0006'),(2,7,'ADM0007'),(3,8,'ADM0008'),(4,9,'ADM0009'),(5,10,'ADM0010'),(6,11,'ADM0011'),(7,12,'ADM0012'),(8,13,'ADM0013'),(9,14,'ADM0014'),(10,15,'ADM0015');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `course_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `subjects_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submissions`
--

DROP TABLE IF EXISTS `submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `grade` varchar(10) DEFAULT NULL,
  `feedback` text,
  PRIMARY KEY (`id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`),
  CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submissions`
--

LOCK TABLES `submissions` WRITE;
/*!40000 ALTER TABLE `submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,1),(2,2),(3,3),(4,4),(5,5);
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Dora Torphy','Arvid_Hoppe@hotmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',2,1,'2025-09-26 12:59:44'),(2,'Dana Hirthe','Modesto81@gmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',2,1,'2025-09-26 12:59:44'),(3,'Noel Towne','Carole.DuBuque@gmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',2,1,'2025-09-26 12:59:44'),(4,'Ms. Dolores Waelchi','Faye37@hotmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',2,1,'2025-09-26 12:59:44'),(5,'Daryl Kuphal','Addison87@yahoo.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',2,1,'2025-09-26 12:59:44'),(6,'Mindy Pagac','Alverta_Spinka@gmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(7,'Drew Donnelly IV','Dale95@gmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(8,'Chester Russel','Chloe.Sawayn@yahoo.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(9,'Todd Sawayn','Isabell82@yahoo.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(10,'Roman Turcotte','Cheyanne83@hotmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(11,'Mr. Earnest Crist','Rozella_Gusikowski@hotmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(12,'Rogelio Kuvalis I','Hillard64@hotmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(13,'Rosemary Dietrich','Maxie53@gmail.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(14,'Shelia Douglas','Benny_Funk98@yahoo.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(15,'Alma Langworth','Ellen50@yahoo.com','$2b$12$Jwz9v8l8ZJ0iQ2Tq6Q0GYe6qk2xgJk2w7v3m5C0U0t8m8iTq0o2Me',3,1,'2025-09-26 12:59:44'),(16,'Super Admin','admin@example.com','$2b$10$Ws/hBCP.V.KWe0gGLanaCOC3fKtpZ/I7pKSSnaDHL9BNdMhdxQ8EW',1,1,'2025-09-26 13:01:43'),(17,'John Teacher','teacher@example.com','$2b$10$YKwlvko52wAoOZzWpf0hH.uTA93hmRFyoV0heeHKfLAZKoVTePeq.',2,1,'2025-09-26 13:01:43'),(18,'Jane Student','student@example.com','$2b$10$ju6Akc2NtVAca6tuhkrQseiGJL0Lya38t8UlhfgTMCA5SKHoxRSHW',3,1,'2025-09-26 13:01:43'),(19,'mato','mato@test.com','$2b$12$zqvhyhuM0DnIeU/i9YI3FOu.EZYdy5UnVQ7sKCGb8WwrXaWEX7e4m',3,1,'2025-09-26 16:39:24');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-30  9:36:25
