class Player {
  final String id;
  final String name;

  Player({
    required this.id,
    required this.name,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
    };
  }

  factory Player.fromMap(Map<String, dynamic> map) {
    return Player(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
    );
  }

  Player copyWith({
    String? id,
    String? name,
  }) {
    return Player(
      id: id ?? this.id,
      name: name ?? this.name,
    );
  }
}
