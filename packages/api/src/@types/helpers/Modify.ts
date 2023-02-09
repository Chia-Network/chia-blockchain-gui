type Modify<T, R> = Omit<T, keyof R> & R;

export default Modify;
