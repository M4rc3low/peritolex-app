const CURRENT_USER_KEY = 'peritolex_current_user';

function getCurrentUser() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);

  if (saved) return JSON.parse(saved);

  const user = {
    id: 'local-user',
    email: 'local@peritolex.app',
    full_name: 'PeritoLex',
    role: 'admin',
    created_date: new Date().toISOString()
  };

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

function getCollectionKey(entityName) {
  return `peritolex_${entityName}`;
}

function readCollection(entityName) {
  const raw = localStorage.getItem(getCollectionKey(entityName));
  return raw ? JSON.parse(raw) : [];
}

function writeCollection(entityName, data) {
  localStorage.setItem(getCollectionKey(entityName), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(`peritolex:${entityName}:changed`));
}

function sortItems(items, sortBy) {
  if (!sortBy) return items;

  const desc = sortBy.startsWith('-');
  const field = desc ? sortBy.slice(1) : sortBy;

  return [...items].sort((a, b) => {
    const av = a?.[field] || '';
    const bv = b?.[field] || '';
    return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
  });
}

function matchesFilter(item, filters = {}) {
  return Object.entries(filters).every(([key, value]) => item?.[key] === value);
}

function createEntityApi(entityName) {
  return {
    async list(sortBy, limit) {
      const items = sortItems(readCollection(entityName), sortBy);
      return typeof limit === 'number' ? items.slice(0, limit) : items;
    },

    async filter(filters = {}, sortBy, limit) {
      const items = readCollection(entityName).filter(item => matchesFilter(item, filters));
      const sorted = sortItems(items, sortBy);
      return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
    },

    async create(data) {
      const user = getCurrentUser();
      const items = readCollection(entityName);

      const item = {
        id: crypto.randomUUID(),
        created_by: data.created_by || user.email,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...data
      };

      items.push(item);
      writeCollection(entityName, items);
      return item;
    },

    async bulkCreate(records = []) {
      const created = [];

      for (const record of records) {
        created.push(await this.create(record));
      }

      return created;
    },

    async update(id, data) {
      const items = readCollection(entityName);
      const updated = items.map(item =>
        item.id === id ? { ...item, ...data, updated_date: new Date().toISOString() } : item
      );

      writeCollection(entityName, updated);
      return updated.find(item => item.id === id) || null;
    },

    async delete(id) {
      writeCollection(entityName, readCollection(entityName).filter(item => item.id !== id));
      return true;
    },

    subscribe(callback) {
      const handler = () => callback();
      window.addEventListener(`peritolex:${entityName}:changed`, handler);
      return () => window.removeEventListener(`peritolex:${entityName}:changed`, handler);
    }
  };
}

const entitiesProxy = new Proxy({}, {
  get(_target, entityName) {
    return createEntityApi(String(entityName));
  }
});

export const peritolexApi = {
  auth: {
    async me() {
      return getCurrentUser();
    },
    logout() {
      localStorage.removeItem(CURRENT_USER_KEY);
    },
    redirectToLogin() {
      return getCurrentUser();
    }
  },

  users: {
    async inviteUser(email, role = 'user') {
      return {
        id: crypto.randomUUID(),
        email,
        role,
        invited_at: new Date().toISOString()
      };
    }
  },

  entities: entitiesProxy,

  functions: {
    async invoke(name, payload = {}) {
      console.warn(`[PeritoLex] Local function placeholder: ${name}`, payload);
      return {
        ok: true,
        name,
        payload,
        local: true
      };
    }
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        return {
          file_url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type
        };
      },

      async ExtractDataFromUploadedFile() {
        return {
          status: 'success',
          output: []
        };
      },

      async SendEmail(payload) {
        console.warn('[PeritoLex] Local email placeholder', payload);
        return { ok: true };
      }
    }
  }
};
