package com.mbsystem.MBSystem.repository.manager;

import com.mbsystem.MBSystem.domain.Manager;
import com.mbsystem.MBSystem.domain.QManager;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ManagerRepository {
  @Autowired
  private SDJpaManagerRepository managerRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public ManagerRepository(EntityManager em) {
    this.em=em;
    this.queryFactory=new JPAQueryFactory(em);
  }

  public Manager save(Manager manager) {
    return managerRepository.save(manager);
  }

  public Optional<Manager> findByLoginId(String loginId) {
    QManager manager = QManager.manager;

    Manager foundManager = queryFactory
        .selectFrom(manager)
        .where(manager.loginId.eq(loginId))
        .fetchOne();

    return Optional.ofNullable(foundManager);
  }

  public Manager findById(Long managerId) {
    return managerRepository.findById(managerId)
        .orElseThrow(() -> new RuntimeException("매니저를 찾을 수 없습니다"));
  }

  public boolean existsById(Long id) {
    QManager manager = QManager.manager;

    Integer count = queryFactory
        .selectOne()
        .from(manager)
        .where(manager.id.eq(id))
        .fetchFirst();

    return count != null;
  }

  public boolean existsByLoginId(String loginId) {
    QManager manager = QManager.manager;

    Integer count = queryFactory
        .selectOne()
        .from(manager)
        .where(manager.loginId.eq(loginId))
        .fetchFirst();

    return count != null;
  }

  public List<Manager> findAllById(Iterable<Long> ids) {
    return managerRepository.findAllById(ids);
  }

  public Manager update(Manager managerEntity) {
    return managerRepository.save(managerEntity);
  }

}
