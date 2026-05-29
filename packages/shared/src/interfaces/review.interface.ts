export interface IReview {
  id: string;
  professorId: string;
  userId: string;
  rating: number; // 0 to 5
  comment: string;
  likes: string[]; // List of userIds who liked
  dislikes: string[]; // List of userIds who disliked
  netLikes: number;
  materiaId?: string; // Stored subject ID (courseCode)
  materiaNombre?: string; // Dynamically resolved subject name
  isEdited?: boolean; // Indicates if review was edited by the author
  user?: {
    name: string;
    image?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ICreateReviewDTO {
  professorId: string;
  rating: number;
  comment: string;
  materiaId: string; // Stored subject ID (courseCode)
}
