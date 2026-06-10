<?php
/**
 * creami Memoro — Classe Comment (CRUD)
 */
class Comment
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getByPhotoId(string $photoId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM comments WHERE photo_id = :photo_id ORDER BY created_at DESC'
        );
        $stmt->execute(['photo_id' => $photoId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): string
    {
        $id = bin2hex(random_bytes(12));
        $stmt = $this->db->prepare(
            'INSERT INTO comments (id, text, author, photo_id, created_at)
             VALUES (:id, :text, :author, :photo_id, NOW())'
        );
        $stmt->execute([
            'id'       => $id,
            'text'     => $data['text'],
            'author'   => $data['author'] ?? 'Anonimo',
            'photo_id' => $data['photo_id'],
        ]);
        return $id;
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM comments WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function countByPhotoId(string $photoId): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) AS total FROM comments WHERE photo_id = :photo_id'
        );
        $stmt->execute(['photo_id' => $photoId]);
        return (int)$stmt->fetch()['total'];
    }
}
