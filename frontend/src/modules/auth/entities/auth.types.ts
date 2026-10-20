// The bodies of the requests that start a session and create an account.
// TODO: replace with the types generated into src/shared/api/generated/ once they exist.

export interface LoginBody {
  email: string
  password: string
}

export interface RegisterBody extends LoginBody {
  display_name: string
}
