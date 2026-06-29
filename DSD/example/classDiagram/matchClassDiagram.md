## Match Class Diagram

```mermaid
classDiagram
    direction LR

    class MatchController {
        <<Controller>>
        -matchService: MatchService
        +MatchController(matchService: MatchService)
        +requestMatch(userDetails: CustomUserDetails, requestDto: MatchRequestDTO): ResponseEntity~MatchResponseDTO~
        +getSentMatches(userDetails: CustomUserDetails): ResponseEntity~List~MatchListResponseDTO~~
        +getReceivedMatches(userDetails: CustomUserDetails): ResponseEntity~List~MatchListResponseDTO~~
        +acceptMatch(matchId: Long, userDetails: CustomUserDetails): ResponseEntity~MatchResponseDTO~
        +declineMatch(matchId: Long, userDetails: CustomUserDetails): ResponseEntity~MatchResponseDTO~
        +updateMatchStatus(requestDto: MatchStatusUpdateByKeyDTO, userDetails: CustomUserDetails): ResponseEntity~MatchResponseDTO~
        +cancelMatch(matchId: Long, userDetails: CustomUserDetails): ResponseEntity~MatchResponseDTO~
    }

    class MatchService {
        <<Service>>
        -matchRepository: MatchRepository
        -userRepository: UserRepository
        -gameMateRepository: GameMateRepository
        -coinService: CoinService
        -notificationService: NotificationService
        +MatchService(matchRepository: MatchRepository, userRepository: UserRepository, gameMateRepository: GameMateRepository, coinService: CoinService, notificationService: NotificationService)
        +requestMatch(requesterId: Long, requestDto: MatchRequestDTO): MatchResponseDTO
        +getSentMatches(userId: Long): List~MatchListResponseDTO~
        +getReceivedMatches(userId: Long): List~MatchListResponseDTO~
        +acceptMatch(matchId: Long, userId: Long): MatchResponseDTO
        +declineMatch(matchId: Long, userId: Long): MatchResponseDTO
        +updateMatchStatus(requestDto: MatchStatusUpdateByKeyDTO, currentUserId: Long): MatchResponseDTO
        +cancelMatchByUser(matchId: Long, requesterId: Long): MatchResponseDTO
    }

    class MatchRepository {
        <<Repository>>
        -matchRepository: SDJpaMatchRepository
        -em: EntityManager
        -queryFactory: JPAQueryFactory
        +MatchRepository(em: EntityManager)
        +saveMatch(match: Match): void
        +findById(id: Long): Optional~Match~
        +findPendingMatch(usersId: Long, order: Long, ordered: Long, game: Long): Match
        +deleteMatch(match: Match): void
        +existsCompletedMatch(userA: Long, userB: Long, gameId: Long): boolean
        +findByOrderUsersId(orderUsersId: Long): List~Match~
        +findByOrderedUsersId(orderedUsersId: Long): List~Match~
    }

    class Match {
        <<Entity>>
        -id: Long
        -users: User
        -orderedUsersId: Long
        -orderUsersId: Long
        -ordersGameId: Long
        -orderStatus: String
    }

    class MatchRequestDTO {
        <<DTO>>
        -orderedUsersId: Long
        -ordersGameId: Long
    }

    class MatchResponseDTO {
        <<DTO>>
        -ordersId: Long
        -usersId: Long
        -orderedUsersId: Long
        -orderUsersId: Long
        -ordersGameId: Long
        -orderStatus: String
        +of(match: Match): MatchResponseDTO
    }
    
    class MatchListResponseDTO {
        <<DTO>>
        -ordersId: Long
        -usersId: Long
        -orderedUsersId: Long
        -orderUsersId: Long
        -ordersGameId: Long
        -orderStatus: String
        -orderedUsername: String
    }

    class MatchStatusUpdateByKeyDTO {
        <<DTO>>
        -orderUsersId: Long
        -orderedUsersId: Long
        -ordersGameId: Long
        -orderStatus: String
    }

    MatchController ..> MatchService : uses
    MatchService ..> MatchRepository : uses
    MatchService ..> UserRepository : uses
    MatchService ..> GameMateRepository : uses
    MatchService ..> CoinService : uses
    MatchService ..> NotificationService : uses
    MatchRepository ..> SDJpaMatchRepository : uses
    SDJpaMatchRepository --|> JpaRepository : extends
    Match ..> User : uses
```

<br>

## MatchController 클래스 정보

| 구분             | Name                | Type                               | Visibility | Description                                      |
|:---------------|:--------------------|:-----------------------------------|:-----------|:-------------------------------------------------|
| **class**      | **MatchController** |                                    |            | 매칭 관련 HTTP 요청을 처리하는 REST 컨트롤러           |
| **Attributes** | matchService        | MatchService                       | private    | 매칭 비즈니스 로직을 처리하는 서비스 객체                |
| **Operations** | MatchController     | void                               | public     | 생성자 (Lombok @RequiredArgsConstructor)         |
|                | requestMatch        | ResponseEntity~MatchResponseDTO~   | public     | 새로운 매칭을 요청 (`POST`)                      |
|                | getSentMatches      | ResponseEntity~List~MatchListResponseDTO~~ | public     | 보낸 매칭 요청 목록을 조회 (`GET /sent`)           |
|                | getReceivedMatches  | ResponseEntity~List~MatchListResponseDTO~~ | public     | 받은 매칭 요청 목록을 조회 (`GET /received`)       |
|                | acceptMatch         | ResponseEntity~MatchResponseDTO~   | public     | 받은 매칭 요청을 수락 (`PATCH /{matchId}/accept`)  |
|                | declineMatch        | ResponseEntity~MatchResponseDTO~   | public     | 받은 매칭 요청을 거절 (`PATCH /{matchId}/decline`) |
|                | updateMatchStatus   | ResponseEntity~MatchResponseDTO~   | public     | 키 값으로 매칭 상태를 업데이트 (`PATCH /status`)       |
|                | cancelMatch         | ResponseEntity~MatchResponseDTO~   | public     | 보낸 매칭 요청을 취소 (`DELETE /{matchId}`)        |

<br>

## MatchService 클래스 정보

| 구분             | Name                  | Type                 | Visibility | Description                                                        |
|:---------------|:----------------------|:---------------------|:-----------|:-------------------------------------------------------------------|
| **class**      | **MatchService**      |                      |            | 매칭 관련 비즈니스 로직을 처리하는 서비스 클래스                              |
| **Attributes** | ... (dependencies)    | ...                  | private    | ...                                                                |
| **Operations** | MatchService          | void                 | public     | 생성자 (Lombok @RequiredArgsConstructor)                         |
|                | requestMatch          | MatchResponseDTO     | public     | 새로운 매칭을 요청하는 비즈니스 로직                                 |
|                | getSentMatches        | List~MatchListResponseDTO~ | public     | 보낸 매칭 요청 목록을 조회하는 비즈니스 로직                               |
|                | getReceivedMatches    | List~MatchListResponseDTO~ | public     | 받은 매칭 요청 목록을 조회하는 비즈니스 로직                               |
|                | acceptMatch           | MatchResponseDTO     | public     | 매칭을 수락하는 비즈니스 로직                                      |
|                | declineMatch          | MatchResponseDTO     | public     | 매칭을 거절하는 비즈니스 로직                                      |
|                | updateMatchStatus     | MatchResponseDTO     | public     | 키 값으로 매칭 상태를 업데이트하는 비즈니스 로직                         |
|                | cancelMatchByUser     | MatchResponseDTO     | public     | 사용자가 보낸 매칭 요청을 취소하는 비즈니스 로직                         |

<br>

## MatchRepository 클래스 정보

| 구분             | Name                    | Type           | Visibility | Description                                            |
|:---------------|:------------------------|:---------------|:-----------|:-------------------------------------------------------|
| **class**      | **MatchRepository**     |                |            | DB에 저장된 매칭 정보를 관리하기 위한 클래스                     |
| **Attributes** | matchRepository         | SDJpaMatchRepository | private    | Spring Data JPA 기능을 사용하기 위함                     |
|                | em                      | EntityManager  | private    | 엔티티 객체를 관리해주는 객체                                |
|                | queryFactory            | JPAQueryFactory  | private    | Query DSL 기능을 사용하기 위한 객체                          |
| **Operations** | MatchRepository         | void           | public     | 생성자                                                 |
|                | saveMatch               | void           | public     | 매칭 정보를 DB에 저장/수정하는 함수                          |
|                | findById                | Optional~Match~ | public     | ID로 특정 매칭 정보를 조회하는 함수                          |
|                | findPendingMatch        | Match          | public     | 요청자, 피요청자, 게임 ID로 대기중인 특정 매칭 정보를 조회하는 함수 |
|                | deleteMatch             | void           | public     | 매칭 정보를 DB에서 삭제하는 함수                             |
|                | existsCompletedMatch    | boolean        | public     | 두 사용자 간에 특정 게임에 대해 완료된 매칭이 있었는지 확인하는 함수 |
|                | findByOrderUsersId      | List~Match~    | public     | 특정 사용자가 보낸 모든 매칭 요청 목록을 조회하는 함수           |
|                | findByOrderedUsersId    | List~Match~    | public     | 특정 사용자에게 온 모든 매칭 요청 목록을 조회하는 함수           |

<br>

## Match 클래스 정보

| 구분             | Name           | Type   | Visibility | Description                                                |
|:---------------|:---------------|:-------|:-----------|:-----------------------------------------------------------|
| **class**      | **Match**      |        |            | 데이터베이스의 `matches` 테이블과 매핑되는 JPA 엔티티        |
| **Attributes** | id             | Long   | private    | 매칭의 고유 ID (PK)                                          |
|                | users          | User   | private    | 매칭을 요청한 사용자 (FK)                                    |
|                | orderedUsersId | Long   | private    | 매칭 요청을 받은 사용자의 ID                                 |
|                | orderUsersId   | Long   | private    | 매칭을 요청한 사용자의 ID                                    |
|                | ordersGameId   | Long   | private    | 매칭된 게임의 ID                                           |
|                | orderStatus    | String | private    | 매칭의 현재 상태 (e.g., PENDING, ACCEPTED, DECLINED) |

<br>

## MatchRequestDTO 클래스 정보

| 구분             | Name                | Type | Visibility | Description                     |
|:---------------|:--------------------|:-----|:-----------|:--------------------------------|
| **class**      | **MatchRequestDTO** |      |            | 매칭 요청 DTO                     |
| **Attributes** | orderedUsersId      | Long | private    | 매칭을 요청받을 게임메이트의 사용자 ID |
|                | ordersGameId        | Long | private    | 매칭을 요청할 게임의 ID             |

<br>

## MatchResponseDTO 클래스 정보

| 구분             | Name                 | Type             | Visibility | Description                                  |
|:---------------|:---------------------|:-----------------|:-----------|:---------------------------------------------|
| **class**      | **MatchResponseDTO** |                  |            | 매칭 정보 응답 DTO                               |
| **Attributes** | ordersId             | Long             | private    | 매칭의 고유 ID                                   |
|                | usersId              | Long             | private    | 매칭을 요청한 사용자의 ID                          |
|                | orderedUsersId       | Long             | private    | 매칭을 요청받은 사용자의 ID                        |
|                | orderUsersId         | Long             | private    | 매칭을 요청한 사용자의 ID                          |
|                | ordersGameId         | Long             | private    | 매칭된 게임의 ID                                 |
|                | orderStatus          | String           | private    | 매칭의 현재 상태                               |
| **Operations** | of                   | MatchResponseDTO | public     | Match 엔티티를 DTO로 변환하는 정적 팩토리 메서드 |

<br>

## MatchListResponseDTO 클래스 정보

| 구분             | Name                 | Type             | Visibility | Description                                  |
|:---------------|:---------------------|:-----------------|:-----------|:---------------------------------------------|
| **class**      | **MatchListResponseDTO** | | | 매칭 목록 조회 응답 DTO |
| **Attributes** | ordersId             | Long             | private    | 매칭의 고유 ID                                   |
|                | ... (other fields)   | ...              | private    | ...                                          |
|                | orderedUsername      | String           | private    | 상대방 사용자 이름                             |

<br>

## MatchStatusUpdateByKeyDTO 클래스 정보

| 구분             | Name                          | Type   | Visibility | Description                             |
|:---------------|:------------------------------|:-------|:-----------|:----------------------------------------|
| **class**      | **MatchStatusUpdateByKeyDTO** |        |            | (사용되지 않음) 매칭 상태 업데이트 요청 DTO      |
| **Attributes** | orderUsersId                  | Long   | private    | 매칭을 요청한 사용자의 ID                         |
|                | orderedUsersId                | Long   | private    | 매칭을 요청받은 사용자의 ID                   |
|                | ordersGameId                  | Long   | private    | 매칭 요청된 게임의 ID                           |
|                | orderStatus                   | String | private    | 업데이트할 매칭 상태                          |
