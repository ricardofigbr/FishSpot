export interface MapFocusRequest {
  latitude: number;
  longitude: number;
  requestId: string;
}

export type BottomTabParamList = {
  List: undefined;
  Iscabox: undefined;
  Map: { focusRequest?: MapFocusRequest } | undefined;
  User: undefined;
};
