import swaggerJsdoc from 'swagger-jsdoc';

export const getApiDocs = () => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API MPMEPE - Système de Suivi Stratégique',
        version: '1.0.0',
        description: 'Documentation officielle des APIs de la plateforme de suivi de l\'avancement des projets et programmes du MPMEPE.',
        contact: {
          name: 'Direction de la Planification',
          email: 'dap@mpmepe.bj'
        }
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'next-auth.session-token'
          }
        }
      },
      security: [
        {
          cookieAuth: []
        }
      ],
    },
    // Chemins vers les fichiers d'API à documenter
    apis: ['./app/api/**/*.ts'],
  };

  // On crée l'objet de spec manuellement pour éviter les soucis d'import export de swagger-jsdoc
  const spec = {
    openapi: '3.0.0',
    info: options.definition.info,
    components: options.definition.components,
    security: options.definition.security,
    paths: {
      '/api/soumissions': {
        get: {
          tags: ['Reporting'],
          summary: 'Liste toutes les soumissions',
          responses: {
            200: { description: 'Succès' },
            401: { description: 'Non authentifié' }
          }
        },
        post: {
          tags: ['Reporting'],
          summary: 'Créer une nouvelle soumission (Rapport Hebdomadaire)',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'string', description: 'JSON stringifié du payload' },
                    isDraft: { type: 'string', description: 'true/false' },
                    m1_acquisitions: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Créé' }
          }
        }
      },
      '/api/dashboard/stats': {
        get: {
          tags: ['Analytics'],
          summary: 'Récupérer les statistiques du Dashboard',
          parameters: [
            { name: 'entiteId', in: 'query', schema: { type: 'string' }, description: 'Filtrer par entité' }
          ],
          responses: {
            200: { description: 'Succès' }
          }
        }
      },
      '/api/notifications': {
        get: {
          tags: ['Alertes'],
          summary: 'Récupérer les notifications de l\'utilisateur',
          responses: {
            200: { description: 'Succès' }
          }
        }
      },
      '/api/notifications/relance': {
        post: {
          tags: ['Alertes'],
          summary: 'Envoyer une relance ministérielle (Admin uniquement)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projectIds: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Envoyé' }
          }
        }
      },
      '/api/rapports/generer': {
        post: {
          tags: ['Intelligence Artificielle'],
          summary: 'Générer une note de conjoncture avec analyse IA',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    entiteId: { type: 'string' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Rapport généré' }
          }
        }
      }
    }
  };
  return spec;
};
