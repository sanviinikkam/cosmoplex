"""Shared agent base and the curriculum definition."""
from dataclasses import dataclass, field
from typing import Optional

COURSE_MODULES = [
    {
        "id": "m1",
        "title": "What is Artificial Intelligence?",
        "description": "Definitions, history, and the scope of AI",
        "content": """
AI is a field of computer science focused on creating systems that perform tasks typically requiring human intelligence.
Key sub-fields: Machine Learning, Natural Language Processing, Computer Vision, Robotics.
Historical milestones: Turing Test (1950), Expert Systems (1980s), Deep Learning revolution (2012+), LLMs (2017+).
Common misconception: AI is not sentient. Current AI is narrow — designed for specific tasks.
        """.strip(),
        "exam_questions": [
            {
                "q": "Which of the following best describes Artificial Intelligence?",
                "type": "mcq",
                "options": ["A computer that thinks like a human", "Systems that perform tasks requiring human intelligence", "Software that automatically updates itself", "Hardware that processes data faster"],
                "answer": "B",
            },
            {
                "q": "What does 'narrow AI' mean?",
                "type": "open",
                "rubric": "Should explain that narrow AI is designed for specific tasks only, unlike hypothetical general AI.",
            },
        ],
        "task": {
            "title": "Find an AI in your daily life",
            "description": "Identify one AI system you interact with daily (e.g. recommendation algorithm, spam filter, autocorrect). Write 3-5 sentences describing what it does, what data it likely uses, and why you believe it uses AI.",
        },
    },
    {
        "id": "m2",
        "title": "Machine Learning Fundamentals",
        "description": "Supervised, unsupervised, and reinforcement learning",
        "content": """
Machine Learning: systems that improve performance on a task with experience (data).
Supervised learning: labeled training data, learns input→output mapping. Examples: spam detection, image classification.
Unsupervised learning: unlabeled data, finds hidden structure. Examples: customer segmentation, anomaly detection.
Reinforcement learning: agent learns by reward/punishment. Examples: game-playing AI, robotics.
Key concept: generalization — the model must perform well on data it hasn't seen before.
        """.strip(),
        "exam_questions": [
            {
                "q": "You have a dataset of emails labeled 'spam' or 'not spam'. Training a model on this is an example of:",
                "type": "mcq",
                "options": ["Reinforcement learning", "Unsupervised learning", "Supervised learning", "Transfer learning"],
                "answer": "C",
            },
            {
                "q": "Explain what 'overfitting' means in machine learning.",
                "type": "open",
                "rubric": "Should describe a model that performs well on training data but poorly on new data — it memorized rather than generalized.",
            },
        ],
        "task": {
            "title": "Classify a real-world problem",
            "description": "Pick a real-world problem and write whether it would be best solved with supervised, unsupervised, or reinforcement learning. Justify your choice in 4-6 sentences.",
        },
    },
    {
        "id": "m3",
        "title": "Neural Networks and Deep Learning",
        "description": "How layers of neurons learn representations",
        "content": """
Neural networks: layers of mathematical nodes (neurons) that transform inputs step-by-step.
Deep learning: neural networks with many layers (deep). Each layer learns progressively more abstract features.
Training: adjust weights using backpropagation and gradient descent to minimize a loss function.
Why deep learning works: learns hierarchical features automatically — no manual feature engineering.
Limitations: requires large data, computationally expensive, black-box interpretability.
        """.strip(),
        "exam_questions": [
            {
                "q": "What does 'backpropagation' do in training a neural network?",
                "type": "mcq",
                "options": ["It moves data backwards through the network", "It adjusts weights based on prediction errors", "It removes unnecessary layers", "It generates synthetic training data"],
                "answer": "B",
            },
            {
                "q": "Why might you prefer a shallow model over a deep neural network for a small dataset?",
                "type": "open",
                "rubric": "Should mention overfitting risk, computational cost, and that deep networks require large datasets to generalize.",
            },
        ],
        "task": {
            "title": "Diagram a neural network",
            "description": "Describe (in text or as a simple diagram) a 3-layer neural network that classifies emails as spam or not-spam. Label the input layer, hidden layer, and output layer. Explain what each layer does.",
        },
    },
    {
        "id": "m4",
        "title": "Large Language Models",
        "description": "Transformers, tokens, and how LLMs work",
        "content": """
LLMs: neural networks trained on massive text datasets to predict the next token.
Transformers: architecture using 'attention' to weigh relationships between words regardless of distance.
Tokens: text broken into subwords (~3/4 of a word on average). LLMs operate on token sequences.
Context window: the maximum tokens an LLM can 'see' at once.
Emergent capabilities: abilities not explicitly trained, arising from scale (reasoning, coding, translation).
Limitations: hallucination, knowledge cutoff, no live memory, stateless between conversations.
        """.strip(),
        "exam_questions": [
            {
                "q": "What is a 'context window' in a large language model?",
                "type": "mcq",
                "options": ["The visual interface for inputting prompts", "The maximum number of tokens the model can process at once", "The window of time the model was trained in", "A filtering mechanism for unsafe content"],
                "answer": "B",
            },
            {
                "q": "What is 'hallucination' in an LLM and why does it happen?",
                "type": "open",
                "rubric": "Should explain that LLMs generate plausible-sounding text by predicting tokens, not by accessing facts — leading to confident but false outputs.",
            },
        ],
        "task": {
            "title": "Identify an LLM limitation in the wild",
            "description": "Find or construct an example of an LLM producing a confident but incorrect response (hallucination). Explain why the model likely produced this error and what the correct information is.",
        },
    },
    {
        "id": "m5",
        "title": "AI Bias and Ethics",
        "description": "Where bias enters AI systems and how to mitigate it",
        "content": """
AI bias: systematic errors in AI outputs that disadvantage certain groups.
Sources: biased training data, biased labels, biased problem framing.
Real examples: facial recognition lower accuracy for darker skin tones, hiring algorithms penalizing women.
Mitigation: diverse data collection, bias audits, human review at decision points.
Ethical frameworks: fairness (which kind?), accountability, transparency, privacy.
Regulation: EU AI Act categorizes AI systems by risk level.
        """.strip(),
        "exam_questions": [
            {
                "q": "A hiring algorithm trained on historical data recommends fewer women for technical roles. This is an example of:",
                "type": "mcq",
                "options": ["Overfitting", "Training data bias", "Context window limitation", "Hallucination"],
                "answer": "B",
            },
            {
                "q": "Name two concrete steps an organization can take to reduce AI bias before deploying a model.",
                "type": "open",
                "rubric": "Should include specific, actionable steps such as: diverse data collection, fairness audits, demographic parity testing, human review, diverse development teams.",
            },
        ],
        "task": {
            "title": "Audit an AI system for bias risk",
            "description": "Pick an AI system used in a consequential context (hiring, lending, healthcare, law enforcement). Identify one potential source of bias and propose a concrete mitigation step. Write 5-8 sentences.",
        },
    },
    {
        "id": "m6",
        "title": "AI in the Workplace",
        "description": "Automation, augmentation, and the future of work",
        "content": """
Automation vs augmentation: some tasks will be automated; more often AI augments human work.
At-risk roles: repetitive, well-defined, data-heavy tasks (data entry, basic analysis, template writing).
Augmented roles: creative synthesis, judgment under uncertainty, relationship-building, novel problem-solving.
Prompt engineering: the skill of directing AI tools effectively — already a key workplace skill.
AI literacy: understanding capabilities and limits is now a baseline professional skill.
Future: humans who use AI well will outpace those who don't. Adaptability > specific skill.
        """.strip(),
        "exam_questions": [
            {
                "q": "Which type of work is MOST likely to be augmented (rather than replaced) by AI in the near term?",
                "type": "mcq",
                "options": ["Data entry and form processing", "Creative problem-solving requiring judgment", "Repetitive assembly line tasks", "Rule-based customer query routing"],
                "answer": "B",
            },
            {
                "q": "What does 'prompt engineering' mean and why is it a valuable workplace skill?",
                "type": "open",
                "rubric": "Should explain that prompt engineering is crafting effective inputs to AI tools to get useful outputs — and that AI tool effectiveness directly depends on how well humans direct them.",
            },
        ],
        "task": {
            "title": "Write your AI collaboration strategy",
            "description": "Describe your current role (or a role you're familiar with). Identify two tasks that AI could help with and explain how you would collaborate with the AI tool to do them. Be specific about which tool you'd use and what you'd prompt it to do.",
        },
    },
]

MODULE_MAP = {m["id"]: m for m in COURSE_MODULES}


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "te": "Telugu",
    "ta": "Tamil",
    "kn": "Kannada",
}


def language_name(code) -> str:
    """Map a language code (e.g. 'te') to its English name (e.g. 'Telugu')."""
    return LANGUAGE_NAMES.get(code or "en", "English")


@dataclass
class LearnerState:
    learner_id: str
    name: str
    language: str
    current_module_id: str
    messages: list = field(default_factory=list)
    last_agent: Optional[str] = None
    exam_in_progress: Optional[dict] = None
    task_in_progress: Optional[dict] = None
