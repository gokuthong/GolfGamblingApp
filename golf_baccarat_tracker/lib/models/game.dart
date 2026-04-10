import 'package:cloud_firestore/cloud_firestore.dart';

class Game {
  final String id;
  final DateTime date;
  final String status;
  final List<String> playerIds;

  Game({
    required this.id,
    required this.date,
    required this.status,
    required this.playerIds,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': Timestamp.fromDate(date),
      'status': status,
      'playerIds': playerIds,
    };
  }

  factory Game.fromMap(Map<String, dynamic> map) {
    return Game(
      id: map['id'] ?? '',
      date: (map['date'] as Timestamp?)?.toDate() ?? DateTime.now(),
      status: map['status'] ?? 'active',
      playerIds: List<String>.from(map['playerIds'] ?? []),
    );
  }

  Game copyWith({
    String? id,
    DateTime? date,
    String? status,
    List<String>? playerIds,
  }) {
    return Game(
      id: id ?? this.id,
      date: date ?? this.date,
      status: status ?? this.status,
      playerIds: playerIds ?? this.playerIds,
    );
  }
}
