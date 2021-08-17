import { ArgsStore } from './ArgsStore';

jest.mock('@storybook/client-logger');

describe('ArgsStore', () => {
  describe('setInitial / get', () => {
    it('returns in a straightforward way', () => {
      const store = new ArgsStore();
      store.setInitial('id', { foo: 'bar' });
      expect(store.get('id')).toEqual({ foo: 'bar' });
    });

    it('does not allow re-setting', () => {
      const store = new ArgsStore();
      store.setInitial('id', { foo: 'bar' });
      store.setInitial('id', { foo: 'baz' });
      expect(store.get('id')).toEqual({ foo: 'bar' });
    });

    it('throws if you try to get non-existent', () => {
      const store = new ArgsStore();
      expect(() => store.get('id')).toThrow(/No args known/);
    });
  });

  describe('update', () => {
    it('overrides on a per-key basis', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      store.update('id', { foo: 'bar' });
      expect(store.get('id')).toEqual({ foo: 'bar' });

      store.update('id', { baz: 'bing' });
      expect(store.get('id')).toEqual({ foo: 'bar', baz: 'bing' });
    });

    it('does not merge objects', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      store.update('id', { obj: { foo: 'bar' } });
      expect(store.get('id')).toEqual({ obj: { foo: 'bar' } });

      store.update('id', { obj: { baz: 'bing' } });
      expect(store.get('id')).toEqual({ obj: { baz: 'bing' } });
    });
  });

  describe('updateFromPersisted', () => {
    it('ensures the types of args are correct', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      const story = {
        id: 'id',
        argTypes: { a: { type: { name: 'string' } } },
      } as any;
      store.updateFromPersisted(story, { a: 'str' });
      expect(store.get('id')).toEqual({ a: 'str' });

      store.updateFromPersisted(story, { a: 42 });
      expect(store.get('id')).toEqual({ a: '42' });
    });

    it('merges objects and sparse arrays', () => {
      const store = new ArgsStore();

      store.setInitial('id', {
        a: { foo: 'bar' },
        b: ['1', '2', '3'],
      });

      const story = {
        id: 'id',
        argTypes: {
          a: { type: { name: 'object', value: { name: 'string' } } },
          b: { type: { name: 'array', value: { name: 'string' } } },
        },
      } as any;
      store.updateFromPersisted(story, { a: { baz: 'bing' } });
      expect(store.get('id')).toEqual({
        a: { foo: 'bar', baz: 'bing' },
        b: ['1', '2', '3'],
      });

      // eslint-disable-next-line no-sparse-arrays
      store.updateFromPersisted(story, { b: [, , '4'] });
      expect(store.get('id')).toEqual({
        a: { foo: 'bar', baz: 'bing' },
        b: ['1', '2', '4'],
      });
    });

    it('checks args are allowed options', () => {
      const store = new ArgsStore();

      store.setInitial('id', {});

      const story = {
        id: 'id',
        argTypes: { a: { type: { name: 'string' }, options: ['a', 'b'] } },
      } as any;
      store.updateFromPersisted(story, { a: 'random' });
      expect(store.get('id')).toEqual({});

      store.updateFromPersisted(story, { a: 'a' });
      expect(store.get('id')).toEqual({ a: 'a' });
    });
  });

  describe('resetOnImplementationChange', () => {
    describe('if initialArgs are unchanged', () => {
      it('does nothing if the args are untouched', () => {
        const store = new ArgsStore();

        const previousStory = {
          id: 'id',
          initialArgs: { a: '1', b: '1' },
        } as any;
        store.setInitial('id', previousStory.initialArgs);

        const story = {
          id: 'id',
          initialArgs: { a: '1', b: '1' },
        } as any;

        store.resetOnImplementationChange(story, previousStory);
        expect(store.get(story.id)).toEqual({ a: '1', b: '1' });
      });

      it('retains any arg changes', () => {
        const store = new ArgsStore();

        const previousStory = {
          id: 'id',
          initialArgs: { a: '1', b: '1' },
        } as any;
        store.setInitial('id', previousStory.initialArgs);

        store.update('id', { a: 'update', c: 'update' });

        const story = {
          id: 'id',
          initialArgs: { a: '1', b: '1' },
        } as any;

        store.resetOnImplementationChange(story, previousStory);
        expect(store.get(story.id)).toEqual({ a: 'update', b: '1', c: 'update' });
      });
    });

    describe('when initialArgs change', () => {
      it('replaces old args with new if the args are untouched', () => {
        const store = new ArgsStore();

        const previousStory = {
          id: 'id',
          initialArgs: { a: '1', b: '1' },
        } as any;
        store.setInitial('id', previousStory.initialArgs);

        const story = {
          id: 'id',
          initialArgs: { a: '1', c: '1' },
        } as any;

        store.resetOnImplementationChange(story, previousStory);
        expect(store.get(story.id)).toEqual({ a: '1', c: '1' });
      });

      it('applies the same delta if the args are changed', () => {
        const store = new ArgsStore();

        const previousStory = {
          id: 'id',
          initialArgs: { a: '1', b: '1' },
        } as any;
        store.setInitial('id', previousStory.initialArgs);

        store.update('id', { a: 'update', c: 'update' });

        const story = {
          id: 'id',
          initialArgs: { a: '2', d: '2' },
        } as any;

        store.resetOnImplementationChange(story, previousStory);
        expect(store.get(story.id)).toEqual({ a: 'update', c: 'update', d: '2' });
      });
    });
  });
});