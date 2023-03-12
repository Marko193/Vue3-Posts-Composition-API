import { reactive, readonly, inject, App } from 'vue'
import axios from 'axios'
import { Post, today, thisMonth, thisWeek } from '@/mocks'

export interface User {
  id: string,
  username: string,
  password: string
}

export type Author = Omit<User, 'password'>

interface BaseState<T> {
  ids: string[],
  all: Map<string, T>,
  loaded: boolean
}

type PostsState = BaseState<Post>
interface AuthorState extends BaseState<Author> {
  currentUserId: string | undefined
}

interface State {
  authors: AuthorState,
  posts: PostsState
}

export const storeKey = Symbol('store')

export class Store {
  state: State

  constructor (initial: State) {
    this.state = reactive(initial)
  }

  install (app: App) {
    app.provide(storeKey, this)
  }

  getState () {
    // console.log(this.state)
    return readonly(this.state)
  }

  async createPost (post: Post) {
    const response = await axios.post<Post>('/posts', post)
    this.state.posts.all.set(response.data.id, response.data)
    this.state.posts.ids.push(response.data.id)
    // console.log(this.state.posts)
  }

  async createUser (user: User) {
    const response = await axios.post<Author>('/users', user)
    this.state.authors.all.set(response.data.id, response.data)
    this.state.authors.ids.push(response.data.id)
    this.state.authors.currentUserId = response.data.id
    // console.log(this.state.authors)
  }

  async fetchPosts () {
    const response = await axios.get<Post[]>('/posts')

    const postsState: PostsState = {
      ids: [],
      all: new Map(),
      loaded: true
    }

    for (const post of response.data) {
      postsState.ids.push(post.id)
      postsState.all.set(post.id, post)
    }
    this.state.posts = postsState
  }
}

const all = new Map<string, Post>()
all.set(today.id, today)
all.set(thisWeek.id, thisWeek)
all.set(thisMonth.id, thisMonth)

export const store = new Store({
  authors: {
    all: new Map<string, Author>(),
    ids: [],
    loaded: false,
    currentUserId: undefined
  },
  posts: {
    all,
    ids: [today.id, thisWeek.id, thisMonth.id],
    loaded: false
  }
})

// providing injection
export function useStore (): Store {
  const _store = inject<Store>(storeKey)
  if (!_store) {
    throw Error('You have forgotten to call a provide')
  }
  return _store
}
