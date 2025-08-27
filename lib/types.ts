export type ChatMessage = {
	role: "user" | "assistant" | "system";
	content: string;
	modelId?: string; // which model produced this assistant message
	ts?: number;
	// Optional metadata for provider responses
	code?: number; // HTTP-like status from backend (e.g., 503)
	provider?: string; // e.g., 'openrouter', 'gemini'
	usedKeyType?: "user" | "shared" | "none";
	// Optional token usage metadata (when provided by backend)
	tokens?: {
		by?: "prompt" | "messages";
		total: number;
		model?: string;
		perMessage?: Array<{
			index: number;
			role: string;
			chars: number;
			tokens: number;
		}>;
	};
	ranking?: {
		rank: number;
		score: number;
		reason: string;
	};
};

export type AiModel = {
	id: string; // unique key in UI
	label: string; // display name
	provider:
		| "gemini"
		| "openrouter"
		| "open-provider"
		| "unstable"
		| "mistral"
		| "ollama";
	model: string; // provider-specific model id
	free?: boolean;
	good?: boolean; // highlight as recommended
	category?: "text" | "image" | "audio"; // model capability category
};

export type ApiKeys = {
	gemini?: string;
	openrouter?: string;
	"open-provider"?: string; // Optional API key for open-provider (currently free)
	unstable?: string; // API key for unstable provider (inference.quran.lat)
	mistral?: string; // API key for Mistral AI (api.mistral.ai)
	ollama?: string; // Base URL for Ollama API
	ollamaModel?: string; // Model name for Ollama
};

export type ChatThread = {
	id: string;
	title: string;
	messages: ChatMessage[];
	createdAt: number;
	// When set, this chat belongs to a specific project. If undefined, it's a general chat.
	projectId?: string;
};

export type Ranking = {
	modelId: string;
	rank: number;
	score: number;
	reason: string;
};
