class Hole {
  final String id;
  final String gameId;
  final int holeNumber;
  final int par;
  final bool isUp;
  final bool isBurn;

  Hole({
    required this.id,
    required this.gameId,
    required this.holeNumber,
    required this.par,
    this.isUp = false,
    this.isBurn = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'gameId': gameId,
      'holeNumber': holeNumber,
      'par': par,
      'isUp': isUp,
      'isBurn': isBurn,
    };
  }

  factory Hole.fromMap(Map<String, dynamic> map) {
    return Hole(
      id: map['id'] ?? '',
      gameId: map['gameId'] ?? '',
      holeNumber: map['holeNumber'] ?? 1,
      par: map['par'] ?? 4,
      isUp: map['isUp'] ?? false,
      isBurn: map['isBurn'] ?? false,
    );
  }

  Hole copyWith({
    String? id,
    String? gameId,
    int? holeNumber,
    int? par,
    bool? isUp,
    bool? isBurn,
  }) {
    return Hole(
      id: id ?? this.id,
      gameId: gameId ?? this.gameId,
      holeNumber: holeNumber ?? this.holeNumber,
      par: par ?? this.par,
      isUp: isUp ?? this.isUp,
      isBurn: isBurn ?? this.isBurn,
    );
  }
}
