import difflib
import logging

logger = logging.getLogger(__name__)

MODEL_AVAILABLE = False
_model = None

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    
    def get_model():
        global _model, MODEL_AVAILABLE
        if _model is None:
            try:
                # Load the model. If there's no internet or storage, this throws and sets availability to False
                _model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.warning(f"Failed to load sentence-transformers model: {e}. Falling back to difflib.")
                MODEL_AVAILABLE = False
                raise e
        return _model
    
    MODEL_AVAILABLE = True
except Exception as e:
    logger.info(f"sentence-transformers or dependencies not available. Falling back to difflib. Error: {e}")
    MODEL_AVAILABLE = False

def calculate_name_similarity(name1: str, name2: str) -> float:
    """
    Calculates display name similarity. Attempts to use semantic embeddings (sentence-transformers),
    and falls back automatically to sequence token overlap (difflib) if the model is not loaded.
    """
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()
    
    # Remove common meeting role suffixes for more accurate parsing
    for suffix in ["(interviewer)", "(hr)", "(recruiter)", "(observer)", "(candidate)", "guest"]:
        n1 = n1.replace(suffix, "").strip()
        n2 = n2.replace(suffix, "").strip()
        
    if not n1 or not n2:
        return 0.0
        
    if MODEL_AVAILABLE:
        try:
            model = get_model()
            embeddings = model.encode([n1, n2])
            v1 = embeddings[0]
            v2 = embeddings[1]
            dot = np.dot(v1, v2)
            norm1 = np.linalg.norm(v1)
            norm2 = np.linalg.norm(v2)
            if norm1 > 0 and norm2 > 0:
                sim = float(dot / (norm1 * norm2))
                # Cosine similarity is in [-1, 1], map to [0, 1] range
                return max(0.0, min(1.0, sim))
        except Exception:
            # Fallback on any runtime model exceptions (e.g. out of memory, import issues)
            pass
            
    # Graceful Fallback: SequenceMatcher + Token Overlap
    ratio = difflib.SequenceMatcher(None, n1, n2).ratio()
    tokens1 = set(n1.split())
    tokens2 = set(n2.split())
    intersection = tokens1.intersection(tokens2)
    if intersection:
        overlap_ratio = len(intersection) / max(len(tokens1), len(tokens2))
        ratio = max(ratio, overlap_ratio)
        
    return ratio
