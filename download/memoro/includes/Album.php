<?php
/**
 * creami Memoro — Classe Album (CRUD)
 */
class Album
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(): array
    {
        $stmt = $this->db->query(
            'SELECT a.*, COUNT(p.id) AS photo_count
             FROM albums a
             LEFT JOIN photos p ON a.id = p.album_id
             GROUP BY a.id
             ORDER BY a.created_at DESC'
        );
        return $stmt->fetchAll();
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT a.*, COUNT(p.id) AS photo_count
             FROM albums a
             LEFT JOIN photos p ON a.id = p.album_id
             WHERE a.id = :id
             GROUP BY a.id'
        );
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function create(array $data): string
    {
        $id = bin2hex(random_bytes(12));
        $stmt = $this->db->prepare(
            'INSERT INTO albums (id, name, description, cover, created_at, updated_at)
             VALUES (:id, :name, :description, :cover, NOW(), NOW())'
        );
        $stmt->execute([
            'id'          => $id,
            'name'        => $data['name'],
            'description' => $data['description'] ?? null,
            'cover'       => $data['cover'] ?? null,
        ]);
        return $id;
    }

    public function update(string $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        foreach (['name', 'description', 'cover'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE albums SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(string $id): bool
    {
        // Set album_id to NULL for photos in this album
        $stmt = $this->db->prepare('UPDATE photos SET album_id = NULL, updated_at = NOW() WHERE album_id = :id');
        $stmt->execute(['id' => $id]);

        $stmt = $this->db->prepare('DELETE FROM albums WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function updateCover(string $id): void
    {
        $stmt = $this->db->prepare(
            'SELECT filepath FROM photos WHERE album_id = :id ORDER BY created_at DESC LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        $photo = $stmt->fetch();

        $cover = $photo ? $photo['filepath'] : null;
        $this->update($id, ['cover' => $cover]);
    }
}
