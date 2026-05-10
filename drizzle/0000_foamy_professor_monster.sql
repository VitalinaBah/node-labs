CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`grades` json NOT NULL,
	`course` int NOT NULL,
	`email` varchar(255),
	`image` varchar(255),
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
