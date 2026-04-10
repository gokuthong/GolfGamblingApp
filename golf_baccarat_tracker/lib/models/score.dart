class Score {
  final String id;
  final String holeId;
  final String playerId;
  final int strokes;
  final int handicap;

  Score({
    required this.id,
    required this.holeId,
    required this.playerId,
    required this.strokes,
    required this.handicap,
  });

  int get netScore => strokes - handicap;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'holeId': holeId,
      'playerId': playerId,
      'strokes': strokes,
      'handicap': handicap,
    };
  }

  factory Score.fromMap(Map<String, dynamic> map) {
    return Score(
      id: map['id'] ?? '',
      holeId: map['holeId'] ?? '',
      playerId: map['playerId'] ?? '',
      strokes: map['strokes'] ?? 0,
      handicap: map['handicap'] ?? 0,
    );
  }

  Score copyWith({
    String? id,
    String? holeId,
    String? playerId,
    int? strokes,
    int? handicap,
  }) {
    return Score(
      id: id ?? this.id,
      holeId: holeId ?? this.holeId,
      playerId: playerId ?? this.playerId,
      strokes: strokes ?? this.strokes,
      handicap: handicap ?? this.handicap,
    );
  }
}
