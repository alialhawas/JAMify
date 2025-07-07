# 🎵 Hybrid Music Recommendation System

This system combines **Collaborative Filtering (CF)** and **Content-Based Filtering (CBF)** to generate personalized music recommendations based on user history and song audio features.

---

## 🔄 System Overview

```
         +---------------------+
         |  User Listening Data|
         +---------+-----------+
                   |
                   v
        +----------+----------+
        | Collaborative Filter| ← ALS Model (user-song matrix)
        +----------+----------+
                   |
                   v
    Top-N personalized recommendations

                   +
                   |
                   v
+--------------------------+              +----------------------------+
|   Song Features Dataset  | ← data.csv   | Genre Feature Centroids    |
+--------------------------+              | ← data_by_genres.csv       |
           |                               +----------------------------+
           v
+-------------------------------+
|  Content-Based Filtering (CBF)|
|  - Cosine similarity to genre |
|  - KMeans clustering          |
|  - Annoy index (similar songs)|
+-------------------------------+

                   +
                   |
                   v
        +------------------------+
        |    Final Recommendation|
        |  Blend CF + CBF scores |
        +------------------------+
```

---

## 🧠 Collaborative Filtering (CF)

CF recommends songs based on **user interactions**, even without knowing anything about the song content.

### ✅ Input

- `user_id`, `song_id`, `rank`
- Converted to `score = 1 / rank` (higher = more preferred)

### ✅ Processing

1. Encode user and song IDs numerically
2. Build a sparse matrix of shape `(users × songs)`
3. Train [ALS (Alternating Least Squares)](https://implicit.readthedocs.io/en/latest/als.html)

```python
matrix = coo_matrix((df['score'], (df['user_idx'], df['item_idx'])))
model = AlternatingLeastSquares(factors=64, iterations=15)
model.fit(matrix.tocsr())
```

### ✅ Output

- Top N recommended songs for a user based on similar behavior

---

## 🎵 Content-Based Filtering (CBF)

CBF recommends songs based on **song audio features** (danceability, energy, etc.).

### ✅ Song Feature Pipeline

```python
data = pd.read_csv("data.csv")
genre_df = pd.read_csv("data_by_genres.csv")

# Predict genres
scaled_songs = StandardScaler().fit_transform(data[features])
scaled_genres = StandardScaler().transform(genre_df[features])
similarity_matrix = cosine_similarity(scaled_songs, scaled_genres)
data['predicted_genre'] = genre_df.iloc[np.argmax(similarity_matrix, axis=1)]['genres'].values
```

### ✅ Clustering + Similarity Index

```python
# KMeans Clustering
song_cluster_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('kmeans', KMeans(n_clusters=20))
])
data['cluster_label'] = song_cluster_pipeline.fit_predict(data[features])

# Annoy Index for fast similarity
annoy = AnnoyIndex(dim=feature_size, metric='euclidean')
for i, vec in enumerate(data_scaled): annoy.add_item(i, vec)
annoy.build(n_trees=10)
```

### ✅ Output

- For a given song or user taste vector, return top-N similar songs

---

## 🔗 Hybrid Recommendation Strategy

We combine both approaches:

- **CF** for personalized, user-based ranking
- **CBF** for similar-song exploration

### ❀ Blending Scores

```python
final_score = 0.6 * cf_score + 0.4 * cosine_similarity
```

Or fallback logic:

- Cold-start user → use only CBF
- Active user → blend CF + CBF

---

## 📈 Example Recommendation Flow

1. User: `user_001`
2. Their top songs: `Blinding Lights`, `Starboy`
3. ALS gives top CF-recommended song IDs
4. CBF finds songs similar to user's top songs using Annoy
5. Merge both lists
6. Rank using blended score

---

## 📊 Visual Summary

### CF Matrix

|       | song\_1 | song\_2 | song\_3 |
| ----- | ------- | ------- | ------- |
| user1 | 1.0     | 0.5     | 0       |
| user2 | 0       | 1.0     | 0.3     |

### Feature Space

- Each song is a point in a 20+ dimensional space of features like energy, danceability, tempo
- KMeans finds song clusters
- Annoy finds nearest neighbors for similarity search

---

## 🚰 Tech Stack

| Component         | Tool                  |
| ----------------- | --------------------- |
| CF model          | `implicit` ALS        |
| Audio features    | Spotify / extracted   |
| Similarity search | `Annoy` (Spotify OSS) |
| Genre matching    | `cosine_similarity`   |
| Clustering        | `KMeans` from sklearn |

---

## 🚀 Improvements & Extensions

- Add temporal dynamics (e.g. change in taste)
- Personalized blending weights
- Incorporate artist similarity
- Deep learning for embeddings (e.g. autoencoders)

---

## ✅ Conclusion

This hybrid system lets us:

- Personalize based on user behavior (CF)
- Discover similar content (CBF)
- Handle cold-starts with features
- Blend strengths of both models

