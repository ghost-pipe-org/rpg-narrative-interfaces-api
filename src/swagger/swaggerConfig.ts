import type { OpenAPIV3 } from "openapi-types";
import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
	openapi: "3.0.0",
	info: {
		title: "RPG System API",
		version: "0.6.0",
		description: "Uma API de sistema de inscrições de mesas de RPG",
		contact: {
			name: "API Support",
		},
	},
	servers: [
		{
			url: "http://localhost:3000",
			description: "Servidor de desenvolvimento local",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
		schemas: {
			User: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					name: {
						type: "string",
						maxLength: 100,
						example: "João Silva",
					},
					email: {
						type: "string",
						format: "email",
						maxLength: 255,
						example: "joao@exemplo.com",
					},
					enrollment: {
						type: "string",
						maxLength: 9,
						example: "123456789",
						nullable: true,
					},
					phoneNumber: {
						type: "string",
						maxLength: 20,
						example: "(11) 99999-9999",
						nullable: true,
					},
					role: {
						type: "string",
						enum: ["ADMIN", "MASTER", "PLAYER"],
						example: "PLAYER",
					},
					createdAt: {
						type: "string",
						format: "date-time",
					},
					updatedAt: {
						type: "string",
						format: "date-time",
					},
				},
			},
			Session: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					title: {
						type: "string",
						maxLength: 255,
						example: "Aventura Épica de D&D",
					},
					description: {
						type: "string",
						example: "Uma aventura emocionante no mundo de Forgotten Realms",
					},
					requirements: {
						type: "string",
						example: "Conhecimento básico das regras de D&D 5e",
						nullable: true,
					},
					system: {
						type: "string",
						maxLength: 100,
						example: "D&D 5e",
					},
					location: {
						type: "string",
						maxLength: 255,
						example: "Sala 101 - Prédio Principal",
						nullable: true,
					},
					status: {
						type: "string",
						enum: ["PENDENTE", "APROVADA", "REJEITADA", "CANCELADA"],
						example: "APROVADA",
					},
					period: {
						type: "string",
						enum: ["MANHA", "TARDE", "NOITE"],
						example: "NOITE",
						nullable: true,
					},
					minPlayers: {
						type: "integer",
						minimum: 1,
						example: 3,
					},
					maxPlayers: {
						type: "integer",
						minimum: 1,
						example: 6,
					},
					approvedDate: {
						type: "string",
						format: "date-time",
						nullable: true,
					},
					cancelEvent: {
						type: "string",
						example: "Sessão cancelada por falta de jogadores",
						nullable: true,
					},
					masterId: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					createdAt: {
						type: "string",
						format: "date-time",
					},
					updatedAt: {
						type: "string",
						format: "date-time",
					},
					possibleDates: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: {
									type: "string",
									format: "uuid",
								},
								date: {
									type: "string",
									format: "date-time",
								},
							},
						},
					},
					enrollments: {
						type: "array",
						items: {
							$ref: "#/components/schemas/SessionEnrollment",
						},
					},
				},
			},
			SessionEnrollment: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					userId: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					sessionId: {
						type: "string",
						format: "uuid",
						example: "123e4567-e89b-12d3-a456-426614174000",
					},
					status: {
						type: "string",
						enum: ["PENDENTE", "APROVADO", "REJEITADO"],
						example: "APROVADO",
					},
					createdAt: {
						type: "string",
						format: "date-time",
					},
				},
			},
			Error: {
				type: "object",
				properties: {
					message: {
						type: "string",
						example: "Erro na operação",
					},
					code: {
						type: "string",
						example: "VALIDATION_ERROR",
						description:
							"Código opcional para o cliente tratar o erro (ex.: VALIDATION_ERROR, REGISTRATION_REQUIRED, EMAIL_NOT_VERIFIED)",
					},
					errors: {
						type: "array",
						description:
							"Detalhes de validação por campo (quando code = VALIDATION_ERROR)",
						items: {
							type: "object",
							properties: {
								path: {
									type: "array",
									items: { type: "string" },
								},
								message: { type: "string" },
								code: { type: "string" },
							},
						},
					},
				},
			},
			LoginRequest: {
				type: "object",
				description:
					"Envie email e password para login tradicional, ou googleIdToken (JWT do Google) para login via Google. Se o email do token existir sem googleId, o vínculo é feito automaticamente. Se não existir, retorna 404 com code REGISTRATION_REQUIRED e message Conta Google não vinculada, crie uma conta para poder fazer login.",
				properties: {
					email: {
						type: "string",
						format: "email",
						example: "usuario@exemplo.com",
					},
					password: {
						type: "string",
						example: "senha123",
					},
					googleIdToken: {
						type: "string",
						example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
						description: "ID token JWT retornado pelo Google Identity Services",
					},
				},
			},
			RegisterRequest: {
				type: "object",
				required: ["name", "email", "password"],
				properties: {
					name: {
						type: "string",
						maxLength: 100,
						example: "João Silva",
					},
					email: {
						type: "string",
						format: "email",
						maxLength: 255,
						example: "joao@exemplo.com",
					},
					password: {
						type: "string",
						minLength: 6,
						example: "senha123",
					},
					enrollment: {
						type: "string",
						maxLength: 9,
						example: "123456789",
						description:
							"Matrícula obrigatória apenas para mestres (masterConfirm=true)",
					},
					phoneNumber: {
						type: "string",
						maxLength: 20,
						example: "(11) 99999-9999",
						description: "Número de telefone opcional",
					},
					masterConfirm: {
						type: "boolean",
						example: false,
						description:
							"Define se o usuário será MASTER (true) ou PLAYER (false)",
					},
				},
			},
			CreateSessionRequest: {
				type: "object",
				required: [
					"title",
					"description",
					"system",
					"possibleDates",
					"period",
					"minPlayers",
					"maxPlayers",
				],
				properties: {
					title: {
						type: "string",
						maxLength: 255,
						example: "Aventura Épica de D&D",
					},
					description: {
						type: "string",
						example: "Uma aventura emocionante no mundo de Forgotten Realms",
					},
					requirements: {
						type: "string",
						example: "Conhecimento básico das regras de D&D 5e",
						description: "Requisitos opcionais para participar da sessão",
					},
					system: {
						type: "string",
						maxLength: 100,
						example: "D&D 5e",
					},
					possibleDates: {
						type: "array",
						items: {
							type: "string",
							format: "date-time",
						},
						example: ["2024-12-31T20:00:00.000Z", "2025-01-07T20:00:00.000Z"],
						description: "Lista de datas possíveis para a sessão",
					},
					period: {
						type: "string",
						enum: ["MANHA", "TARDE", "NOITE"],
						example: "NOITE",
					},
					minPlayers: {
						type: "integer",
						minimum: 1,
						example: 3,
					},
					maxPlayers: {
						type: "integer",
						minimum: 1,
						example: 6,
					},
					location: {
						type: "string",
						maxLength: 255,
						example: "Sala 101 - Prédio Principal",
					},
				},
			},
			CreateWorkshopRequest: {
				type: "object",
				required: [
					"title",
					"description",
					"possibleDates",
					"period",
					"minPlayers",
					"maxPlayers",
				],
				properties: {
					title: {
						type: "string",
						maxLength: 255,
						example: "Introdução ao D&D",
					},
					description: {
						type: "string",
						example: "Oficina para ensinar o básico de Roleplay",
					},
					requirements: {
						type: "string",
						example: "Trazer lápis e borracha",
						description: "Requisitos opcionais para participar da oficina",
					},
					possibleDates: {
						type: "array",
						items: {
							type: "string",
							format: "date-time",
						},
						example: ["2024-12-31T20:00:00.000Z", "2025-01-07T20:00:00.000Z"],
						description: "Lista de datas possíveis para a oficina",
					},
					period: {
						type: "string",
						enum: ["MANHA", "TARDE", "NOITE"],
						example: "TARDE",
					},
					minPlayers: {
						type: "integer",
						minimum: 1,
						example: 5,
					},
					maxPlayers: {
						type: "integer",
						minimum: 1,
						example: 20,
					},
					location: {
						type: "string",
						maxLength: 255,
						example: "Sala de Oficinas 1",
					},
					facilitatorIds: {
						type: "array",
						items: {
							type: "string",
							format: "uuid",
						},
						example: ["123e4567-e89b-12d3-a456-426614174000"],
						description:
							"Lista de UUIDs dos facilitadores (opcional, o criador é inserido automaticamente)",
					},
				},
			},
			AuthResponse: {
				type: "object",
				properties: {
					token: {
						type: "string",
						example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
					},
					user: {
						$ref: "#/components/schemas/User",
					},
				},
			},
		},
	},
};

const options = {
	definition: swaggerDefinition,
	apis: [], // Não usaremos comentários nos arquivos
};

export const swaggerSpec = swaggerJSDoc(options) as OpenAPIV3.Document;
