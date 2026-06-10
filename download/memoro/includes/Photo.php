<?php
/**
 * creami Memoro — Classe Photo (CRUD)
 */
class Photo
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(array $filters = []): array
    {
        $where  = '1=1';
        $params = [];

        if (!empty($filters['search'])) {
            $where .= ' AND (p.title LIKE :search OR p.description LIKE :search2 OR p.tags LIKE :search3)';
            $params['search']  = '%' . $filters['search'] . '%';
            $params['search2'] = '%' . $filters['search'] . '%';
            $params['search3'] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['album_id'])) {
            $where .= ' AND p.album_id = :album_id';
            $params['album_id'] = $filters['album_id'];
        }

        if (!empty($filters['favorite'])) {
            $where .= ' AND p.favorite = 1';
        }

        if (!empty($filters['tag'])) {
            $where .= ' AND p.tags LIKE :tag';
            $params['tag'] = '%' . $filters['tag'] . '%';
        }

        $limit  = (int)($filters['limit'] ?? PHOTOS_PER_PAGE);
        $offset = (int)($filters['offset'] ?? 0);

        $sql = "SELECT p.*, a.name AS album_name
                FROM photos p
                LEFT JOIN albums a ON p.album_id = a.id
                WHERE {$where}
                ORDER BY p.created_at DESC
                LIMIT {$limit} OFFSET {$offset}";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT p.*, a.name AS album_name
             FROM photos p
             LEFT JOIN albums a ON p.album_id = a.id
             WHERE p.id = :id'
        );
        $stmt->execute(['id' => $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function create(array $data): string
    {
        $id = $this->generateId();
        $stmt = $this->db->prepare(
            'INSERT INTO photos (id, title, description, filename, filepath, thumb_path, mimetype, size, width, height, tags, album_id, views, favorite, created_at, updated_at)
             VALUES (:id, :title, :description, :filename, :filepath, :thumb_path, :mimetype, :size, :width, :height, :tags, :album_id, 0, :favorite, NOW(), NOW())'
        );
        $stmt->execute([
            'id'          => $id,
            'title'       => $data['title'] ?? 'Senza titolo',
            'description' => $data['description'] ?? null,
            'filename'    => $data['filename'],
            'filepath'    => $data['filepath'],
            'thumb_path'  => $data['thumb_path'] ?? null,
            'mimetype'    => $data['mimetype'],
            'size'        => $data['size'],
            'width'       => $data['width'] ?? null,
            'height'      => $data['height'] ?? null,
            'tags'        => $data['tags'] ?? null,
            'album_id'    => $data['album_id'] ?? null,
            'favorite'    => !empty($data['favorite']) ? 1 : 0,
        ]);
        return $id;
    }

    public function update(string $id, array $data): bool
    {
        $fields = [];
        $params = ['id' => $id];

        foreach (['title', 'description', 'tags', 'album_id', 'favorite'] as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                if ($field === 'favorite') {
                    $params[$field] = !empty($data[$field]) ? 1 : 0;
                } elseif ($field === 'album_id' && empty($data[$field])) {
                    $params[$field] = null;
                } else {
                    $params[$field] = $data[$field];
                }
            }
        }

        if (empty($fields)) return false;

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE photos SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete(string $id): bool
    {
        $photo = $this->getById($id);
        if (!$photo) return false;

        // Delete files
        $basePath = dirname(__DIR__);
        if (!empty($photo['filepath']) && file_exists($basePath . '/' . $photo['filepath'])) {
            unlink($basePath . '/' . $photo['filepath']);
        }
        if (!empty($photo['thumb_path']) && file_exists($basePath . '/' . $photo['thumb_path'])) {
            unlink($basePath . '/' . $photo['thumb_path']);
        }

        // Delete comments
        $stmt = $this->db->prepare('DELETE FROM comments WHERE photo_id = :id');
        $stmt->execute(['id' => $id]);

        // Delete photo record
        $stmt = $this->db->prepare('DELETE FROM photos WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function incrementViews(string $id): void
    {
        $stmt = $this->db->prepare('UPDATE photos SET views = views + 1 WHERE id = :id');
        $stmt->execute(['id' => $id]);
    }

    public function toggleFavorite(string $id): bool
    {
        $stmt = $this->db->prepare('UPDATE photos SET favorite = NOT favorite, updated_at = NOW() WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function getStats(): array
    {
        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM photos');
        $totalPhotos = $stmt->fetch()['total'];

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM albums');
        $totalAlbums = $stmt->fetch()['total'];

        $stmt = $this->db->query('SELECT COUNT(*) AS total FROM photos WHERE favorite = 1');
        $totalFavorites = $stmt->fetch()['total'];

        $stmt = $this->db->query('SELECT COALESCE(SUM(views), 0) AS total FROM photos');
        $totalViews = $stmt->fetch()['total'];

        return [
            'photos'    => $totalPhotos,
            'albums'    => $totalAlbums,
            'favorites' => $totalFavorites,
            'views'     => $totalViews,
        ];
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(12));
    }
}
