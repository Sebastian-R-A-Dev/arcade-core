export const swaggerDefinition = {
  openapi: '3.0.3',
  tags: [
    { name: 'Auth', description: 'JWT access tokens and refresh rotation' },
    {
      name: 'Users',
      description:
        'Perfil del usuario autenticado en el contexto del appId del access token (Bearer).',
    },
    {
      name: 'Admin',
      description:
        'Panel admin: listados globales. Solo tokens JWT cuyo appId coincide con la app `ADMIN_APP` en BD.',
    },
    { name: 'Apps', description: 'Registered applications' },
    { name: 'Questions', description: 'Quiz content per app' },
    { name: 'Scores', description: 'Gameplay history and bests' },
  ],
  info: {
    title: 'ArcadeCore API',
    version: '0.1.0',
    description:
      'MVP modular monolith API: auth (JWT + refresh), users, apps, questions, scores.',
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'API v1',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Short-lived access token from POST /auth/login or /auth/register',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      AuthRegisterRequest: {
        type: 'object',
        required: ['app_name', 'email', 'password', 'nickname'],
        properties: {
          app_name: {
            type: 'string',
            description:
              'Must match an existing App.name in ArcadeCore. ADMIN_APP is forbidden (403).',
          },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          nickname: { type: 'string', minLength: 1, maxLength: 64, description: 'Display name (profile)' },
        },
      },
      UserPublicDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          app_id: { type: 'integer' },
          email: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          profile: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer' },
              nickname: { type: 'string' },
            },
          },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/UserPublicDto',
          },
        },
      },
      AppCreateRequest: {
        type: 'object',
        required: ['name', 'url', 'type'],
        properties: {
          name: { type: 'string' },
          url: {
            type: 'string',
            format: 'uri',
            description: 'Absolute http(s) URL where this app is served',
          },
          type: { type: 'string', enum: ['quiz', 'administration'] },
          is_active: { type: 'boolean' },
        },
      },
      AppDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          type: { type: 'string' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AdminUserListItemDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          app_id: { type: 'integer' },
          app_name: { type: 'string', description: 'Registered App.name for this user' },
          nickname: { type: 'string', nullable: true },
          avatar_url: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      DifficultyDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          app_id: { type: 'integer' },
          name: { type: 'string' },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      DifficultyCreateRequest: {
        type: 'object',
        required: ['app_id', 'name'],
        properties: {
          app_id: { type: 'integer' },
          name: { type: 'string', minLength: 1, maxLength: 64 },
          is_active: { type: 'boolean' },
        },
      },
      DifficultyUpdateRequest: {
        type: 'object',
        required: ['name', 'is_active'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 64 },
          is_active: { type: 'boolean' },
        },
      },
      QuestionDifficultyDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          is_active: { type: 'boolean' },
        },
      },
      QuestionCreateRequest: {
        type: 'object',
        required: ['app_id', 'difficulty_id', 'type', 'question', 'answer'],
        properties: {
          app_id: { type: 'integer' },
          difficulty_id: { type: 'integer', description: 'FK a difficulties; debe pertenecer a app_id' },
          type: {
            type: 'string',
            enum: ['fill_blank', 'multiple_choice', 'word_order', 'image_multiple_choice'],
            description:
              '`image_multiple_choice`: texto en `question`; imagen vía `image_id` (librería admin GET/POST /admin/images) o `image_url` (URL pública).',
          },
          question: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
            ],
          },
          options: {
            type: 'array',
            items: { type: 'string' },
          },
          answer: { type: 'string' },
          image_url: {
            type: 'string',
            format: 'uri',
            nullable: true,
            description:
              'Para `image_multiple_choice`: obligatorio si no se envía `image_id`. URL HTTPS (p. ej. Supabase Storage).',
          },
          image_name: {
            type: 'string',
            minLength: 1,
            maxLength: 256,
            nullable: true,
            description:
              'Etiqueta opcional para la imagen (solo con `image_multiple_choice`).',
          },
          image_id: {
            type: 'integer',
            minimum: 1,
            nullable: true,
            description:
              'Para `image_multiple_choice`: ID en tabla `images` (subida con POST /admin/images). Alternativa a `image_url`.',
          },
        },
      },
      QuestionDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          app_id: { type: 'integer' },
          difficulty_id: { type: 'integer' },
          difficulty: { $ref: '#/components/schemas/QuestionDifficultyDto' },
          type: { type: 'string' },
          question: {},
          options: {
            type: 'array',
            items: { type: 'string' },
          },
          answer: { type: 'string' },
          image_url: {
            type: 'string',
            nullable: true,
            description: 'Presente solo para preguntas basadas en imagen.',
          },
          image_name: {
            type: 'string',
            nullable: true,
            description: 'Nombre legible de la imagen (upload o creación de pregunta).',
          },
          image_id: {
            type: 'integer',
            nullable: true,
            description: 'FK a librería `images` cuando la pregunta referencia un recurso subido vía admin.',
          },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthLoginRequest: {
        type: 'object',
        required: ['app_name', 'email', 'password'],
        properties: {
          app_name: { type: 'string', description: 'Unique app name (e.g. ADMIN_APP)' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthRegisterResponse: {
        type: 'object',
        description: 'Refresh token is also set as HttpOnly cookie on the API host.',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserPublicDto' },
              redirect_url: {
                type: 'string',
                format: 'uri',
                description: 'Public URL of the app (from App.url)',
              },
              access_token: { type: 'string' },
              expires_in: { type: 'string', example: '15m' },
            },
          },
        },
      },
      AuthLoginResponse: {
        type: 'object',
        description: 'Refresh token is also set as HttpOnly cookie on the API host.',
        properties: {
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/UserPublicDto' },
              redirect_url: {
                type: 'string',
                format: 'uri',
                description: 'Public URL of the app (from App.url)',
              },
              access_token: { type: 'string' },
              expires_in: { type: 'string' },
            },
          },
        },
      },
      AuthTokensResponse: {
        type: 'object',
        description: 'New refresh is rotated via HttpOnly cookie only.',
        properties: {
          data: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              expires_in: { type: 'string' },
            },
          },
        },
      },
      RefreshRequest: {
        type: 'object',
        properties: {
          refresh_token: {
            type: 'string',
            description:
              'Optional when the refresh HttpOnly cookie is sent (credentials: include).',
          },
          expected_app_name: {
            type: 'string',
            description:
              'Optional. When set, refresh succeeds only if this refresh session belongs to an App with this exact name (see App.name). Otherwise 403 without rotating.',
          },
        },
      },
      LogoutResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              revoked: { type: 'boolean' },
            },
          },
        },
      },
      ScoreCreateRequest: {
        type: 'object',
        required: ['app_id', 'score'],
        properties: {
          app_id: { type: 'integer' },
          score: { type: 'integer', minimum: 0 },
        },
      },
      ScoreDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          app_id: { type: 'integer' },
          score: { type: 'integer' },
          max_score: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
} as const;
